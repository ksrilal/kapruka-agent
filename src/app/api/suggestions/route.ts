import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { buildModel } from "@/lib/ai/orchestrator";

const SuggestionsRequestSchema = z.object({
  locale: z.enum(["en", "si", "ta-Latn"]).optional(),
  cartItems: z.array(z.object({ name: z.string(), category: z.string().optional() })).max(5).default([]),
  pendingOrder: z.object({ orderRef: z.string(), itemName: z.string().optional() }).optional(),
  lastSession: z
    .object({
      id: z.string(),
      title: z.string(),
      // Tail of the actual conversation, oldest first — lets the model detect
      // topic drift (e.g. a chat that opened about "electronics" but the
      // visitor's real interest turned out to be "earbuds" mid-conversation)
      // instead of only ever seeing the stale opening title.
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(12),
    })
    .optional(),
});

const SuggestionSchema = z.object({
  displayText: z.string().describe("What Kiyo says out loud, second person, short and warm."),
  promptText: z.string().describe("What gets sent as the visitor's own message when they tap the bubble, first person."),
  kind: z
    .enum(["new", "resume"])
    .describe(
      "'resume' only when this suggestion is directly continuing the specific past chat session provided (topic actually discussed there, e.g. the earbuds sub-topic of an 'electronics' chat). 'new' for anything else, including cart/order-based ideas or fresh suggestions."
    ),
  sessionId: z
    .string()
    .optional()
    .describe("Required and must equal the provided session id when kind is 'resume'; omit otherwise."),
});

const SuggestionsSchema = z.object({
  suggestions: z.array(SuggestionSchema).min(1).max(3),
});

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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

function buildPrompt(body: z.infer<typeof SuggestionsRequestSchema>): string {
  const lines: string[] = [];
  if (body.cartItems.length > 0) {
    lines.push(`Cart items: ${body.cartItems.map((i) => i.name + (i.category ? ` (${i.category})` : "")).join(", ")}.`);
  }
  if (body.pendingOrder) {
    lines.push(`Pending order ${body.pendingOrder.orderRef}${body.pendingOrder.itemName ? ` for ${body.pendingOrder.itemName}` : ""}.`);
  }
  if (body.lastSession) {
    lines.push(`Last chat session (id: ${body.lastSession.id}), opened as "${body.lastSession.title}". Transcript, oldest first:`);
    for (const m of body.lastSession.messages) {
      lines.push(`  ${m.role}: ${m.content}`);
    }
  }
  if (lines.length === 0) {
    lines.push("No history available for this visitor yet — keep suggestions general and inviting.");
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are Kiyo, Kapruka's shopping assistant. Generate up to 3 short ambient suggestion bubbles for the home page, based on the visitor's real history below.

Rules:
- Each suggestion has displayText (Kiyo speaking, second person, one short sentence, warm and casual) and promptText (first person, what the visitor would say if they tapped it).
- Ground suggestions in the specific history given — reference actual item/category/order names, don't be generic.
- If a chat transcript is provided, read the whole thing, not just the opening title — conversations drift (e.g. it may open about "electronics" but the visitor's real ask by the end is "earbuds"). Ground any session-based suggestion in what was ACTUALLY discussed, especially toward the end of the transcript.
- Set kind to "resume" only for a suggestion that continues the specific chat session provided — set sessionId to that session's id in that case. Everything else (cart, orders, fresh ideas) is kind "new" with no sessionId.
- Vary language naturally across the set: mix English, Sinhala, and Singlish/Tanglish transliteration where it fits Kapruka's Sri Lankan audience — don't force all three in every response.
- Keep each line under 90 characters.
- Return only the structured suggestions, nothing else.`;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof SuggestionsRequestSchema>;
  try {
    const raw = await req.json();
    body = SuggestionsRequestSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const model = buildModel();
    const { object } = await generateObject({
      model,
      schema: SuggestionsSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(body),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(15_000),
    });
    return NextResponse.json({ suggestions: object.suggestions });
  } catch (err) {
    console.error({ event: "suggestions_error", message: (err as Error).message });
    return NextResponse.json({ error: "AI suggestions unavailable" }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
