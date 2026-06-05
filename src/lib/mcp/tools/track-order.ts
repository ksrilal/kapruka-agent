import { callMcpTool } from "../client";
import type { TrackOrderInput } from "@/types/mcp";

export async function trackOrder(input: TrackOrderInput): Promise<string> {
  return callMcpTool("kapruka_track_order", { ...input }) as Promise<string>;
}
