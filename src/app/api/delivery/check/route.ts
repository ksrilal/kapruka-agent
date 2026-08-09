import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkDelivery } from "@/lib/mcp/tools/check-delivery";
import { extractJson } from "@/lib/utils/mcp-json";
import { CheckDeliveryOutputSchema } from "@/types/mcp";

const RequestSchema = z.object({
  city: z.string().min(1),
  delivery_date: z.string().optional(),
  product_id: z.string().optional(),
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

// Lean delivery-check endpoint — used client-side by the Orders panel's
// Reorder action to pre-validate the recipient's saved city/date before
// adding items to cart, without going through the chat/AI path.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const raw = await checkDelivery({
      city: body.city,
      delivery_date: body.delivery_date,
      product_id: body.product_id,
      response_format: "json",
    });
    const parsed = extractJson(raw as string);
    const result = CheckDeliveryOutputSchema.safeParse(parsed);
    if (!result.success) {
      console.error({ event: "check_delivery_schema_fail", issues: result.error.issues });
      return NextResponse.json({ error: "Invalid delivery data from MCP" }, { status: 502 });
    }
    return NextResponse.json({ delivery: result.data });
  } catch (err) {
    console.error({ event: "check_delivery_error", error: String(err) });
    return NextResponse.json({ error: "Failed to check delivery" }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
