import { callMcpTool } from "../client";
import type { GetProductInput } from "@/types/mcp";

export async function getProduct(input: GetProductInput): Promise<string> {
  return callMcpTool("kapruka_get_product", { ...input }) as Promise<string>;
}
