import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      mcp: !!process.env.KAPRUKA_MCP_URL,
    },
  });
}
