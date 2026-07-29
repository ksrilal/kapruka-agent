import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { buildModel } from "@/lib/ai/orchestrator";

const SuggestionsRequestSchema = z.object({
  locale: z.enum(["en", "si", "ta-Latn"]).optional(),
  cartItems: z.array(z.object({ name: z.string(), category: z.string().optional() })).max(5).default([]),
  pendingOrder: z.object({ orderRef: z.string(), itemName: z.string().optional() }).optional(),
  lastSession: z.object({ title: z.string() }).optional(),
});

const SuggestionSchema = z.object({
  displayText: z.string().describe("What Kiyo says out loud, second person, short and warm."),
  promptText: z.string().describe("What gets sent as the visitor's own message when they tap the bubble, first person."),
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
    lines.push(`Last chat session was about: "${body.lastSession.title}".`);
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
