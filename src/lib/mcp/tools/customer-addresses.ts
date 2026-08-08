import { callMcpTool } from "../client";

// Private-preview tool (hidden from tools/list). See customer-details.ts for
// the access-token handling rationale.
export async function getCustomerAddresses(input: { email: string }): Promise<string> {
  const accessToken = process.env.KAPRUKA_ACCESS_TOKEN;
  if (!accessToken) throw new Error("KAPRUKA_ACCESS_TOKEN not set");
  return callMcpTool("kapruka_customer_addresses", {
    email: input.email,
    access_token: accessToken,
    response_format: "json",
  }) as Promise<string>;
}
