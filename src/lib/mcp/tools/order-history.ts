import { callMcpTool } from "../client";

// Private-preview tool (hidden from tools/list). See customer-details.ts for
// the access-token handling rationale.
export async function getOrderHistory(input: { email: string; limit?: number }): Promise<string> {
  const accessToken = process.env.KAPRUKA_ACCESS_TOKEN;
  if (!accessToken) throw new Error("KAPRUKA_ACCESS_TOKEN not set");
  return callMcpTool("kapruka_order_history", {
    email: input.email,
    access_token: accessToken,
    limit: input.limit ?? 5,
    response_format: "json",
  }) as Promise<string>;
}
