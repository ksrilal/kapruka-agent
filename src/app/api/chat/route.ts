// Tell Vercel to allow up to 60s for this route (requires Pro; Hobby gets 10s)
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { createSSEStream } from "@/lib/ai/streaming";
import { detectLocale } from "@/lib/utils/unicode";
import { TrackOrderOutputSchema } from "@/types/mcp";
import type { ChatSSEEvent } from "@/types/ai";
import type { Locale } from "@/types/domain";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        // Accept both "model" (legacy Gemini) and "assistant" (OpenAI/Claude)
        role: z.enum(["user", "assistant", "model"]),
        content: z.string(),
      })
    )
    .min(1),
  locale: z.enum(["en", "si", "ta-Latn"]).optional(),
  customerContext: z.string().max(4000).optional(),
  customerEmail: z.string().email().optional(),
});

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Evict expired entries periodically to prevent unbounded growth
  if (RATE_LIMIT_MAP.size >= 1000) {
    for (const [key, val] of RATE_LIMIT_MAP) {
      if (now > val.resetAt) RATE_LIMIT_MAP.delete(key);
    }
  }

  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

async function* chatGenerator(
  body: z.infer<typeof ChatRequestSchema>
): AsyncGenerator<ChatSSEEvent> {
  const lastUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");
  const userText = lastUserMessage?.content ?? "";

  const locale: Locale =
    body.locale ?? detectLocale(userText);

  // Channel to forward tool_call events from the orchestrator into the generator.
  // Uses a "notify" latch: the drain loop creates a fresh promise+resolve pair
  // BEFORE suspending, so any concurrent orchestrator callback always has a live
  // resolve to call — eliminating the race where done fires before we await.
  type ToolEvent = { tool: string; status: "running" | "done" };
  const toolQueue: ToolEvent[] = [];
  let orchestratorDone = false;

  let notifyResolve: (() => void) | undefined;
  function notify() {
    const r = notifyResolve;
    notifyResolve = undefined;
    r?.();
  }
  function waitForNotify() {
    return new Promise<void>((r) => { notifyResolve = r; });
  }

  let result: import("@/lib/ai/orchestrator").OrchestratorResult | undefined;
  let orchestratorError: Error | undefined;
  const orchestratorRun = runOrchestrator(body.messages, locale, (tool, status) => {
    toolQueue.push({ tool, status });
    notify();
  }, body.customerContext, body.customerEmail).then((r) => {
    result = r;
    orchestratorDone = true;
    notify();
  }).catch((err) => {
    orchestratorError = err as Error;
    console.error({ event: "chat_error", message: (err as Error).message });
    orchestratorDone = true;
    notify();
  });

  // Drain tool events while orchestrator runs
  while (!orchestratorDone || toolQueue.length > 0) {
    if (toolQueue.length === 0 && !orchestratorDone) {
      // Register the resolve BEFORE suspending so concurrent notify() calls land
      const pending = waitForNotify();
      // Re-check after registering — orchestrator may have finished between the
      // while-condition check and this line
      if (!orchestratorDone && toolQueue.length === 0) {
        await pending;
      }
      continue;
    }
    const ev = toolQueue.shift();
    if (ev) {
      yield { type: "tool_call" as const, tool: ev.tool, status: ev.status };
    }
  }
  await orchestratorRun;

  if (!result) {
    const is429 = orchestratorError?.message?.includes("429");
    yield {
      type: "error" as const,
      message: is429 ? "MCP error 429" : "AI service temporarily unavailable.",
      retryable: !is429,
    };
    return;
  }

  // Step 1: extract JSON blocks (fenced or bare) and collect ranges to strip
  const ranges: [number, number][] = [];
  const structuredBlocks: string[] = [];

  // Fenced ```json ... ``` blocks
  const fencedRe = /```json\s*([\s\S]*?)\s*```/g;
  let m: RegExpExecArray | null;
  while ((m = fencedRe.exec(result.text)) !== null) {
    structuredBlocks.push(m[1].trim());
    ranges.push([m.index, m.index + m[0].length]);
  }

  // Bare {"__type":...} objects — scan forward trying progressively longer slices
  // until JSON.parse succeeds. This correctly handles } inside string values,
  // unlike a naive brace counter.
  let pos = 0;
  while (true) {
    const idx = result.text.indexOf('{"__type":', pos);
    if (idx === -1) break;
    // Skip if already inside a fenced range
    if (ranges.some(([s, e]) => idx >= s && idx < e)) { pos = idx + 1; continue; }
    // Find candidate end positions at each top-level `}` and try parsing
    let depth = 0, found = false;
    for (let i = idx; i < result.text.length; i++) {
      const ch = result.text[i];
      // Skip string contents so } inside strings don't affect depth
      if (ch === '"') {
        i++;
        while (i < result.text.length && result.text[i] !== '"') {
          if (result.text[i] === "\\") i++; // skip escaped char
          i++;
        }
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const candidate = result.text.slice(idx, i + 1);
          try {
            JSON.parse(candidate); // validate before accepting
            structuredBlocks.push(candidate);
            ranges.push([idx, i + 1]);
            pos = i + 1;
            found = true;
          } catch { /* malformed — skip */ }
          break;
        }
      }
    }
    if (!found) pos = idx + 1;
  }

  // Step 2: emit structured events
  const emittedTypes = new Set<string>();
  // cartAction is a MUTATING operation (unlike products/order/orderStatus which
  // are idempotent to re-render) — if a model repeats the same block, re-emitting
  // it would double-add to the cart. Dedupe per (action, product_id) pair, while
  // still allowing different products to each be added in one reply.
  const seenCartActions = new Set<string>();
  for (const block of structuredBlocks) {
    try {
      const parsed = JSON.parse(block) as { __type: string; data: unknown };
      if (parsed.__type === "cartAction" && parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
        const data = parsed.data as { action?: string; product_id?: string; quantity?: number };
        if (data.action === "add" && typeof data.product_id === "string" && data.product_id) {
          const dedupeKey = `${data.action}:${data.product_id}`;
          if (!seenCartActions.has(dedupeKey)) {
            seenCartActions.add(dedupeKey);
            emittedTypes.add(parsed.__type);
            yield {
              type: "cartAction" as const,
              action: "add",
              productId: data.product_id,
              quantity: typeof data.quantity === "number" && data.quantity > 0 ? data.quantity : 1,
            };
          }
        }
        continue;
      }

      if (emittedTypes.has(parsed.__type)) continue;
      emittedTypes.add(parsed.__type);
      if (parsed.__type === "products" && Array.isArray(parsed.data)) {
        const seen = new Map<string, unknown>();
        for (const p of parsed.data as Array<{ id?: string }>) {
          const key = p.id ?? JSON.stringify(p);
          if (!seen.has(key)) seen.set(key, p);
        }
        yield { type: "products" as const, products: [...seen.values()] as import("@/types/domain").ProductSummary[] };
      } else if (parsed.__type === "order" && parsed.data) {
        yield { type: "order" as const, order: parsed.data as import("@/types/domain").Order };
      } else if (parsed.__type === "orderStatus" && parsed.data) {
        const statusResult = TrackOrderOutputSchema.safeParse(parsed.data);
        if (statusResult.success) {
          yield { type: "orderStatus" as const, orderStatus: statusResult.data as import("@/types/domain").OrderStatus };
        } else {
          console.error({ event: "order_status_schema_fail", issues: statusResult.error.issues });
          emittedTypes.delete(parsed.__type);
        }
      } else if (parsed.__type === "giftProfile" && parsed.data && typeof parsed.data === "object") {
        const data = parsed.data as { occasion?: unknown };
        if (typeof data.occasion === "string" && data.occasion) {
          yield { type: "giftProfile" as const, giftProfile: parsed.data as import("@/types/domain").GiftProfile };
        } else {
          emittedTypes.delete(parsed.__type);
        }
      } else if (parsed.__type === "customerLookup" && parsed.data && typeof parsed.data === "object") {
        const data = parsed.data as { email?: unknown };
        if (typeof data.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          yield { type: "customerLookup" as const, email: data.email };
        } else {
          emittedTypes.delete(parsed.__type);
        }
      }
    } catch { /* malformed — skip */ }
  }

  // Step 3: remove all extracted ranges + unclosed fences + stray backticks from text
  // Sort ranges descending so we splice from end to preserve indices
  ranges.sort((a, b) => b[0] - a[0]);
  let cleanText = result.text;
  for (const [s, e] of ranges) {
    cleanText = cleanText.slice(0, s) + cleanText.slice(e);
  }
  cleanText = cleanText
    .replace(/```json[\s\S]*/g, "")  // unclosed fence
    .replace(/```/g, "")              // stray backticks
    .trim();

  if (cleanText) {
    yield { type: "text", text: cleanText };
  } else if (emittedTypes.has("products")) {
    yield { type: "text", text: "Here's what I found — tap any card to explore or add to cart." };
  } else if (emittedTypes.has("order")) {
    yield { type: "text", text: "Your order is ready — tap Pay Now on the card below." };
  } else if (emittedTypes.has("orderStatus")) {
    yield { type: "text", text: "Here's the latest status for your order." };
  } else if (emittedTypes.has("cartAction")) {
    yield { type: "text", text: "Done — added to your cart!" };
  } else {
    // The orchestrator succeeded but produced no text and no cards — the model
    // returned an empty final turn (provider hiccup). Don't leave a blank bubble.
    console.error({ event: "chat_empty_response" });
    yield {
      type: "text",
      text: "Hmm, I lost my train of thought there — could you say that again?",
    };
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof ChatRequestSchema>;
  try {
    const raw = await req.json();
    body = ChatRequestSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stream = createSSEStream(chatGenerator(body));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
