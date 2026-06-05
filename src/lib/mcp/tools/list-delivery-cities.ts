import { callMcpTool } from "../client";
import type { ListDeliveryCitiesInput } from "@/types/mcp";

export async function listDeliveryCities(input: ListDeliveryCitiesInput = {}): Promise<string> {
  return callMcpTool("kapruka_list_delivery_cities", { ...input }) as Promise<string>;
}
