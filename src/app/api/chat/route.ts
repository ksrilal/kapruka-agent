import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { createSSEStream, encodeSSE } from "@/lib/ai/streaming";
import { detectLocale } from "@/lib/utils/unicode";
import type { ChatSSEEvent } from "@/types/ai";
import type { Locale } from "@/types/domain";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .min(1),
  locale: z.enum(["en", "si", "ta-Latn"]).optional(),
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
  const userText =
    lastUserMessage?.parts.map((p) => p.text).join("") ?? "";

  const locale: Locale =
    body.locale ?? detectLocale(userText);

  let result;
  try {
    result = await runOrchestrator(body.messages, locale);
  } catch (err) {
    console.error({ event: "chat_error", message: (err as Error).message });
    yield {
      type: "error",
      message: "AI service temporarily unavailable.",
      retryable: true,
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

  // Bare {"__type":...} objects — brace-count from each occurrence
  let pos = 0;
  while (true) {
    const idx = result.text.indexOf('{"__type":', pos);
    if (idx === -1) break;
    // Skip if already inside a fenced range
    if (ranges.some(([s, e]) => idx >= s && idx < e)) { pos = idx + 1; continue; }
    let depth = 0, end = -1;
    for (let i = idx; i < result.text.length; i++) {
      if (result.text[i] === "{") depth++;
      else if (result.text[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > idx) {
      structuredBlocks.push(result.text.slice(idx, end + 1));
      ranges.push([idx, end + 1]);
    }
    pos = end > idx ? end + 1 : idx + 1;
  }

  // Step 2: emit structured events
  const emittedTypes = new Set<string>();
  for (const block of structuredBlocks) {
    try {
      const parsed = JSON.parse(block) as { __type: string; data: unknown };
      if (emittedTypes.has(parsed.__type)) continue;
      emittedTypes.add(parsed.__type);
      if (parsed.__type === "products" && Array.isArray(parsed.data)) {
        const seen = new Map<string, unknown>();
        for (const p of parsed.data as Array<{ id?: string }>) {
          const key = p.id ?? JSON.stringify(p);
          if (!seen.has(key)) seen.set(key, p);
        }
        yield { type: "products", products: [...seen.values()] as never[] };
      } else if (parsed.__type === "order" && parsed.data) {
        yield { type: "order", order: parsed.data as never };
      } else if (parsed.__type === "orderStatus" && parsed.data) {
        yield { type: "orderStatus", orderStatus: parsed.data as never };
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
  }
  // If nothing at all — the error path already handled it above
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
