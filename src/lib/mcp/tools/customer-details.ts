import { callMcpTool } from "../client";

// Private-preview tool (hidden from tools/list). The access token identifies
// our finalist group, not the customer — it never comes from the AI/client,
// only from the server env, and is never returned to the browser.
export async function getCustomerDetails(input: { email: string }): Promise<string> {
  const accessToken = process.env.KAPRUKA_ACCESS_TOKEN;
  if (!accessToken) throw new Error("KAPRUKA_ACCESS_TOKEN not set");
  return callMcpTool("kapruka_customer_details", {
    email: input.email,
    access_token: accessToken,
    response_format: "json",
  }) as Promise<string>;
}
