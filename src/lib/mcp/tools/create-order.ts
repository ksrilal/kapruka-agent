import { callMcpTool } from "../client";
import type { CreateOrderInput } from "@/types/mcp";

export async function createOrder(input: CreateOrderInput): Promise<string> {
  // MCP requires sender.name as a non-empty string.
  // When Gemini sets anonymous:true it often omits name — supply a fallback.
  const sender = {
    ...input.sender,
    name: input.sender?.name?.trim() || "Anonymous",
    anonymous: input.sender?.anonymous ?? false,
  };
  return callMcpTool("kapruka_create_order", { ...input, sender }) as Promise<string>;
}
