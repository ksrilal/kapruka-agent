import { generateText } from "ai";
import type { LanguageModel } from "ai";
import type {
  ModelMessage,
  ToolResultPart,
} from "ai";
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

// Per-call timeout — keeps total request well within Vercel's 25s limit
const GENERATE_TIMEOUT_MS = 20_000;

function withTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
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
      maxRetries: 0,
      abortSignal: withTimeout(GENERATE_TIMEOUT_MS),
    });

    // staticToolCalls are the typed ones (our known tools)
    const toolCalls = result.staticToolCalls ?? [];
    if (toolCalls.length === 0) {
      return { text: result.text, embedded };
    }

    // Execute all tool calls in this round (may be parallel).
    // Errors are caught per-call and returned as structured error strings so
    // the AI can read them and craft a helpful reply instead of crashing the request.
    const toolResultParts: ToolResultPart[] = await Promise.all(
      toolCalls.map(async (tc) => {
        onToolCall?.(tc.toolName, "running");
        let value: string;
        try {
          const toolResult = await executeTool(tc.toolName, tc.input as Record<string, unknown>);
          embedded.push(toolResult);
          value = String(toolResult);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const is429 = msg.includes("429");
          value = is429
            ? `TOOL_ERROR: Kapruka is rate-limiting requests right now (429). Tell the user Kapruka is busy and ask them to try again in a moment. Do not retry the tool.`
            : `TOOL_ERROR: ${msg}. Tell the user the tool failed and suggest trying again or rephrasing. Do not invent results.`;
        }
        onToolCall?.(tc.toolName, "done");
        return {
          type: "tool-result" as const,
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          output: { type: "text" as const, value },
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

  // Signal UI that synthesis is starting (tools done, now generating final reply)
  onToolCall?.("__response__", "running");

  // Fallback: get final text after max rounds
  try {
    const final = await generateText({
      model,
      system: systemPrompt,
      messages: currentMessages,
      maxRetries: 0,
      abortSignal: withTimeout(GENERATE_TIMEOUT_MS),
    });

    onToolCall?.("__response__", "done");
    return { text: final.text, embedded };
  } catch (err) {
    onToolCall?.("__response__", "done");
    throw err;
  }
}
