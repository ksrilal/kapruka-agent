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
import { aiTools, guestTools } from "./tool-definitions";
import {
  searchProducts,
  getProduct,
  listCategories,
  listDeliveryCities,
  checkDelivery,
  createOrder,
  trackOrder,
} from "@/lib/mcp";
import { getOrderHistory } from "@/lib/mcp/tools/order-history";
import { getCustomerAddresses } from "@/lib/mcp/tools/customer-addresses";
import type { Locale } from "@/types/domain";

// ─── Provider factory ─────────────────────────────────────────────────────────

type AIProvider = "google" | "anthropic" | "openai";

function resolveProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER ?? "google").toLowerCase();
  if (raw === "anthropic" || raw === "claude") return "anthropic";
  if (raw === "openai" || raw === "chatgpt") return "openai";
  return "google";
}

export function buildModel(): LanguageModel {
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

// customerEmail is NEVER read from `args` — it only ever comes from the
// server-trusted session (the email the customer themselves typed in to
// onboard, threaded down from the chat route). The model has no `email`
// param on these tools and cannot supply or guess one.
async function executeTool(name: string, args: Record<string, unknown>, customerEmail?: string): Promise<unknown> {
  switch (name) {
    case "search_products":      return searchProducts(args as never);
    case "get_product":          return getProduct(args as never);
    case "list_categories":      return listCategories(args as never);
    case "list_delivery_cities": return listDeliveryCities(args as never);
    case "check_delivery":       return checkDelivery(args as never);
    case "create_order":         return createOrder(args as never);
    case "track_order":          return trackOrder(args as never);
    case "get_order_history":
      if (!customerEmail) return "TOOL_ERROR: No signed-in customer for this session.";
      return getOrderHistory({ email: customerEmail, limit: (args as { limit?: number }).limit });
    case "get_customer_addresses":
      if (!customerEmail) return "TOOL_ERROR: No signed-in customer for this session.";
      return getCustomerAddresses({ email: customerEmail });
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// Per-call timeout — keeps total request well within Vercel's 25s limit
const GENERATE_TIMEOUT_MS = 20_000;

function withTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

// Runs a batch of tool calls in parallel, capturing per-call errors as
// structured strings so the AI can read them and craft a helpful reply
// instead of the request crashing.
async function runToolCalls(
  toolCalls: ReadonlyArray<{ toolName: string; toolCallId: string; input: unknown }>,
  embedded: unknown[],
  onToolCall?: (tool: string, status: "running" | "done") => void,
  customerEmail?: string
): Promise<ToolResultPart[]> {
  return Promise.all(
    toolCalls.map(async (tc) => {
      onToolCall?.(tc.toolName, "running");
      let value: string;
      try {
        const toolResult = await executeTool(tc.toolName, tc.input as Record<string, unknown>, customerEmail);
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
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runOrchestrator(
  messages: OrchestratorMessage[],
  locale: Locale,
  onToolCall?: (tool: string, status: "running" | "done") => void,
  customerContext?: string,
  customerEmail?: string
): Promise<OrchestratorResult> {
  const model = buildModel();
  const systemPrompt = buildSystemPrompt(locale, customerContext);
  const embedded: unknown[] = [];
  // Account-scoped tools are only offered to the model once a customer is
  // actually signed in — otherwise it has no way to call them anyway (no
  // email param exists on them), so keep them out of its options entirely.
  const tools = customerEmail ? aiTools : guestTools;

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
      tools,
      maxRetries: 0,
      abortSignal: withTimeout(GENERATE_TIMEOUT_MS),
    });

    // staticToolCalls are the typed ones (our known tools)
    const toolCalls = result.staticToolCalls ?? [];
    if (toolCalls.length === 0) {
      if (result.text.trim()) {
        return { text: result.text, embedded };
      }
      // Provider occasionally returns a genuinely empty final turn (no text, no
      // tool calls) — a transient hiccup, not "I'm done, nothing to say". Rather
      // than hand the user a canned string, fold a recovery directive into the
      // SYSTEM prompt (not a fake user turn — that risks Kiyo replying to "the
      // system note" as if the user said it) so she notices and recovers in her
      // own voice, tone, and language — in character, locale-consistent.
      const recoverySystemPrompt =
        systemPrompt +
        "\n\n═══════════════════════════════════════════════\nRECOVERY — YOUR LAST REPLY CAME BACK EMPTY\n═══════════════════════════════════════════════\n" +
        "Something glitched and you didn't actually say anything to the user last turn. " +
        "Don't mention glitches, errors, or \"system notes\" — just notice naturally, in character, " +
        "in the same language and tone you've been using, and ask the user to repeat what they said " +
        "(e.g. \"Sorry, lost my train of thought there — say that again?\" in their language/style).";
      const retry = await generateText({
        model,
        system: recoverySystemPrompt,
        messages: currentMessages,
        maxRetries: 0,
        abortSignal: withTimeout(GENERATE_TIMEOUT_MS),
      });
      return { text: retry.text, embedded };
    }

    // Execute all tool calls in this round (may be parallel).
    const toolResultParts = await runToolCalls(toolCalls, embedded, onToolCall, customerEmail);

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
