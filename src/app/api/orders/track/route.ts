import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackOrder } from "@/lib/mcp/tools/track-order";
import { TrackOrderOutputSchema } from "@/types/mcp";

const RequestSchema = z.object({
  order_number: z.string().min(4).max(40),
});

// Try to extract a JSON object from a string that may be markdown-wrapped.
// MCP servers sometimes return ```json ... ``` even when json format is requested.
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Try direct parse first
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  // Try stripping markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ }
  }
  // Try finding first { ... } block
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(trimmed.slice(braceStart, braceEnd + 1)); } catch { /* fall through */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const raw = await trackOrder({ order_number: body.order_number, response_format: "json" });

    const parsed = extractJson(raw as string);
    if (parsed === null) {
      console.error({ event: "track_order_parse_fail", order_number: body.order_number, raw_preview: String(raw).slice(0, 200) });
      return NextResponse.json({ error: "Unexpected response format from MCP" }, { status: 502 });
    }

    const result = TrackOrderOutputSchema.safeParse(parsed);
    if (!result.success) {
      console.error({ event: "track_order_schema_fail", order_number: body.order_number, issues: result.error.issues });
      return NextResponse.json({ error: "Invalid order data from MCP" }, { status: 502 });
    }

    return NextResponse.json({ status: result.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error({ event: "track_order_error", order_number: body.order_number, error: msg });
    if (msg.includes("not found") || msg.includes("404")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
