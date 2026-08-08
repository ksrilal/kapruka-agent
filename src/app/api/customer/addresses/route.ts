import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerAddresses } from "@/lib/mcp/tools/customer-addresses";
import { extractJson } from "@/lib/utils/mcp-json";
import type { CustomerAddress } from "@/types/domain";

const RequestSchema = z.object({
  email: z.string().email(),
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

function mapAddresses(raw: unknown): CustomerAddress[] {
  const root = raw as Record<string, unknown> | null;
  const book = (root?.["address book"] as Record<string, unknown>[]) ?? [];
  return book.map((a) => ({
    recipient_name: a.name as string,
    address: a.address as string,
    city: a.city as string,
    phone: (a.mobile as string) || undefined,
  }));
}

// Lean, addresses-only endpoint — used by the Addresses panel to always pull
// fresh data from MCP on open, instead of trusting the account snapshot
// fetched once at login via /api/customer.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  let raw: string;
  try {
    raw = await getCustomerAddresses({ email: body.email });
  } catch (err) {
    console.error({ event: "customer_addresses_error", error: String(err) });
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 502 });
  }

  if (/^Error\s*\(/i.test(raw.trim())) {
    return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
  }

  const addresses = mapAddresses(extractJson(raw));

  return NextResponse.json({ addresses, fetchedAt: Date.now() });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
