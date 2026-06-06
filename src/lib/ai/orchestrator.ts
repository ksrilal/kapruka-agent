import { generateText } from "ai";
import type { LanguageModel } from "ai";
import type {
  ModelMessage,
  ToolResultPart,
} from "@ai-sdk/provider-utils";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { buildSystemPrompt } from "./system-prompt";
import { aiTools } from "./tool-definitions";
import {
  searchProducts,
  getProduct,
  listCategories,
  listDeliveryCities,
  checkDelivery,
  createOrder,
  trackOrder,
} from "@/lib/mcp";
import type { Locale } from "@/types/domain";

// ─── Provider factory ─────────────────────────────────────────────────────────

type AIProvider = "google" | "anthropic" | "openai";

function resolveProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER ?? "google").toLowerCase();
  if (raw === "anthropic" || raw === "claude") return "anthropic";
  if (raw === "openai" || raw === "chatgpt") return "openai";
  return "google";
}

function buildModel(): LanguageModel {
  const provider = resolveProvider();

  // Each provider has its own dedicated key + model env vars.
  // AI_API_KEY / AI_MODEL act as overrides (legacy fallback).
  switch (provider) {
    case "anthropic": {
      const apiKey = process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
      const modelId = process.env.AI_MODEL ?? process.env.ANTHROPIC_AI_MODEL ?? "claude-sonnet-4-6";
      return createAnthropic({ apiKey })(modelId);
    }
    case "openai": {
      const apiKey = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      const modelId = process.env.AI_MODEL ?? process.env.OPENAI_AI_MODEL ?? "gpt-4o";
      return createOpenAI({ apiKey })(modelId);
    }
    case "google":
    default: {
      const apiKey = process.env.AI_API_KEY ?? process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_API_KEY not set");
      const modelId = process.env.AI_MODEL ?? process.env.GOOGLE_AI_MODEL ?? "models/gemini-2.0-flash";
      return createGoogleGenerativeAI({ apiKey })(modelId);
    }
  }
}

// ─── Message types ────────────────────────────────────────────────────────────

// role "model" is the legacy Gemini alias; we accept it for backwards compat.
export interface OrchestratorMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

export interface OrchestratorResult {
  text: string;
  embedded: unknown[];
}

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "search_products":      return searchProducts(args as never);
    case "get_product":          return getProduct(args as never);
    case "list_categories":      return listCategories(args as never);
    case "list_delivery_cities": return listDeliveryCities(args as never);
    case "check_delivery":       return checkDelivery(args as never);
    case "create_order":         return createOrder(args as never);
    case "track_order":          return trackOrder(args as never);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runOrchestrator(
  messages: OrchestratorMessage[],
  locale: Locale,
  onToolCall?: (tool: string, status: "running" | "done") => void
): Promise<OrchestratorResult> {
  const model = buildModel();
  const systemPrompt = buildSystemPrompt(locale);
  const embedded: unknown[] = [];

  // Normalize "model" → "assistant" for SDK compatibility
  const history: ModelMessage[] = messages.map((m) => ({
    role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
    content: m.content,
  }));

  // Tool call loop — up to 4 rounds (most flows need 1-2, delivery needs 3)
  let currentMessages = history;

  for (let round = 0; round < 4; round++) {
    const result = await generateText({
      model,
      system: systemPrompt,
      messages: currentMessages,
      tools: aiTools,
    });

    // staticToolCalls are the typed ones (our known tools)
    const toolCalls = result.staticToolCalls ?? [];
    if (toolCalls.length === 0) {
      return { text: result.text, embedded };
    }

    // Execute all tool calls in this round (may be parallel)
    const toolResultParts: ToolResultPart[] = await Promise.all(
      toolCalls.map(async (tc) => {
        onToolCall?.(tc.toolName, "running");
        const toolResult = await executeTool(tc.toolName, tc.input as Record<string, unknown>);
        onToolCall?.(tc.toolName, "done");
        embedded.push(toolResult);
        return {
          type: "tool-result" as const,
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          output: { type: "text" as const, value: String(toolResult) },
        };
      })
    );

    // Use result.response.messages for the assistant turn — these carry providerOptions
    // (including Gemini's thoughtSignature) which must be preserved when continuing
    // the conversation, otherwise Gemini warns about missing thought_signature.
    currentMessages = [
      ...currentMessages,
      ...result.response.messages,
      { role: "tool" as const, content: toolResultParts },
    ];
  }

  // Fallback: get final text after max rounds
  const final = await generateText({
    model,
    system: systemPrompt,
    messages: currentMessages,
  });
  return { text: final.text, embedded };
}
