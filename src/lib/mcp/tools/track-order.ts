import { callMcpTool } from "../client";
import type { TrackOrderInput } from "@/types/mcp";

export async function trackOrder(input: TrackOrderInput): Promise<string> {
  // Always request JSON — the AI is instructed to copy the exact MCP object
  // verbatim into the orderStatus card, which only works with the structured
  // shape (the markdown response renders `amount` as an unparseable Python-dict
  // string and omits several fields the card needs).
  return callMcpTool("kapruka_track_order", { ...input, response_format: "json" }) as Promise<string>;
}
