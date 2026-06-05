import { callMcpTool } from "../client";
import type { CheckDeliveryInput } from "@/types/mcp";

export async function checkDelivery(input: CheckDeliveryInput): Promise<string> {
  return callMcpTool("kapruka_check_delivery", { ...input }) as Promise<string>;
}
