import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const provider = process.env.AI_PROVIDER ?? "google";
  const hasKey =
    !!process.env.AI_API_KEY ||
    (provider === "google"    && !!process.env.GOOGLE_API_KEY) ||
    (provider === "anthropic" && !!process.env.ANTHROPIC_API_KEY) ||
    (provider === "openai"    && !!process.env.OPENAI_API_KEY);

  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    env: {
      ai_provider: provider,
      ai_key_set: hasKey,
      mcp: !!process.env.KAPRUKA_MCP_URL,
    },
  });
}
