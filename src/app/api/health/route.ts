import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    env: {
      ai: !!process.env.AI_API_KEY,
      ai_provider: process.env.AI_PROVIDER ?? "google",
      mcp: !!process.env.KAPRUKA_MCP_URL,
    },
  });
}
