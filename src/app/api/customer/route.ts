import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerDetails } from "@/lib/mcp/tools/customer-details";
import { getOrderHistory } from "@/lib/mcp/tools/order-history";
import { getCustomerAddresses } from "@/lib/mcp/tools/customer-addresses";
import { extractJson } from "@/lib/utils/mcp-json";
import type { CustomerProfile, CustomerOrderSummary, CustomerAddress } from "@/types/domain";

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

function firstArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

// The MCP tools return space-separated keys (e.g. "first name", "order date")
// nested under wrapper objects — these adapters normalize that into the
// domain shape the rest of the app (useChat, EmptyState) already expects.
function mapProfile(raw: unknown, fallbackEmail: string): CustomerProfile | null {
  const root = raw as Record<string, unknown> | null;
  const c = (root?.customer ?? root) as Record<string, unknown> | undefined;
  if (!c) return null;
  const name = (c["full name"] as string) ?? [c["first name"], c["last name"]].filter(Boolean).join(" ");
  if (!name) return null;
  return {
    name,
    email: (c.email as string) ?? fallbackEmail,
    phone: (c.phone as string) || undefined,
    language: (c.language as string) || undefined,
    billing: (c.billing as Record<string, unknown>) || undefined,
  };
}

function mapOrders(raw: unknown): CustomerOrderSummary[] {
  const list = firstArray(raw) as Record<string, unknown>[];
  return list.map((o) => {
    const recipient = o.recipient as Record<string, unknown> | undefined;
    const items = o.items as Record<string, unknown>[] | undefined;
    return {
      order_ref: o.reference as string,
      status: o.status as string,
      order_date: o["order date"] as string | undefined,
      delivery_date: o["delivery date"] as string | undefined,
      amount: o.amount as { value: string; currency: string } | undefined,
      recipient: recipient ? { name: recipient.name as string } : undefined,
      items: items?.map((i) => ({
        name: i.name as string,
        quantity: i.quantity as number | undefined,
        product_id: (i.product_id ?? i["product id"] ?? i.id) as string | undefined,
      })),
    };
  });
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

  const [detailsResult, ordersResult, addressesResult] = await Promise.allSettled([
    getCustomerDetails({ email: body.email }),
    getOrderHistory({ email: body.email, limit: 5 }),
    getCustomerAddresses({ email: body.email }),
  ]);

  if (detailsResult.status === "rejected") {
    const msg = detailsResult.reason instanceof Error ? detailsResult.reason.message : String(detailsResult.reason);
    console.error({ event: "customer_details_error", error: msg });
    const notFound = msg.includes("not found") || msg.includes("404");
    return NextResponse.json(
      { error: notFound ? "No account found for this email" : "Failed to fetch account details" },
      { status: notFound ? 404 : 502 }
    );
  }

  const detailsRaw = detailsResult.value as string;
  // The tool can "succeed" (no thrown rejection) while its content is a plain-text
  // error, e.g. "Error (email_not_allowed): Customer data is not available for
  // this email in the current test phase" — treat that as not-found, not a parse bug.
  if (/^Error\s*\(/i.test(detailsRaw.trim())) {
    return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
  }

  const profile = mapProfile(extractJson(detailsRaw), body.email);
  if (!profile) {
    console.error({ event: "customer_details_parse_fail", raw_preview: detailsRaw.slice(0, 200) });
    return NextResponse.json({ error: "Unexpected response format from MCP" }, { status: 502 });
  }

  const orders: CustomerOrderSummary[] =
    ordersResult.status === "fulfilled" ? mapOrders(extractJson(ordersResult.value as string)) : [];
  if (ordersResult.status === "rejected") {
    console.error({ event: "order_history_error", error: String(ordersResult.reason) });
  }

  const addresses: CustomerAddress[] =
    addressesResult.status === "fulfilled" ? mapAddresses(extractJson(addressesResult.value as string)) : [];
  if (addressesResult.status === "rejected") {
    console.error({ event: "customer_addresses_error", error: String(addressesResult.reason) });
  }

  return NextResponse.json({
    email: body.email,
    profile,
    orders,
    addresses,
    fetchedAt: Date.now(),
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
