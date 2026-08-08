import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProduct } from "@/lib/mcp/tools/get-product";
import { extractJson } from "@/lib/utils/mcp-json";
import { GetProductOutputSchema } from "@/types/mcp";
import type { ProductSummary } from "@/types/domain";

const RequestSchema = z.object({
  product_ids: z.array(z.string().min(1)).min(1).max(20),
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

// Bridges the full product-detail shape (kapruka_get_product) into the
// lean shape the cart store expects (kapruka_search_products' result shape).
function toProductSummary(p: z.infer<typeof GetProductOutputSchema>): ProductSummary {
  return {
    id: p.id,
    name: p.name,
    summary: p.summary,
    price: p.price,
    compare_at_price: p.compare_at_price,
    in_stock: p.in_stock,
    stock_level: p.stock_level,
    image_url: p.images[0] ?? null,
    category: p.category,
    rating: p.rating,
    ships_internationally: p.shipping.ships_internationally,
    url: p.url,
  };
}

// Lean product-by-id lookup, used by the Orders panel's Reorder action to
// resolve past order_ids back into cart-ready ProductSummary data. Not
// exposed to the AI — get_product is already available to it as a tool.
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

  const products: ProductSummary[] = [];
  const missing: string[] = [];

  await Promise.all(
    body.product_ids.map(async (product_id) => {
      try {
        const raw = await getProduct({ product_id, response_format: "json" });
        if (/^Error\s*\(/i.test((raw as string).trim())) {
          missing.push(product_id);
          return;
        }
        const parsed = extractJson(raw as string);
        const result = GetProductOutputSchema.safeParse(parsed);
        if (!result.success) {
          missing.push(product_id);
          return;
        }
        products.push(toProductSummary(result.data));
      } catch (err) {
        console.error({ event: "product_lookup_error", product_id, error: String(err) });
        missing.push(product_id);
      }
    })
  );

  return NextResponse.json({ products, missing });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
