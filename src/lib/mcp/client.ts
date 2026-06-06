const MCP_URL = process.env.KAPRUKA_MCP_URL ?? "https://mcp.kapruka.com/mcp";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;
const FETCH_TIMEOUT_MS = 8_000;

let _sessionId: string | null = null;
let _initPromise: Promise<string> | null = null;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function getSessionId(): Promise<string> {
  if (_sessionId) return _sessionId;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Step 1 — initialize and get session ID
    const initRes = await fetchWithTimeout(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "kapruka-agent", version: "1.0.0" },
        },
      }),
    });

    const sessionId = initRes.headers.get("mcp-session-id");
    if (!sessionId) throw new Error("MCP: no session ID in initialize response");

    // Step 2 — send initialized notification
    await fetchWithTimeout(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });

    _sessionId = sessionId;
    return sessionId;
  })();

  try {
    return await _initPromise;
  } catch (err) {
    // Reset so next call retries
    _initPromise = null;
    _sessionId = null;
    throw err;
  }
}

export async function callMcpTool(
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS);
      // Session is only reset on 404/406 below — don't reset unconditionally here
    }

    try {
      const sessionId = await getSessionId();

      const res = await fetchWithTimeout(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: toolName, arguments: { params } },
        }),
      });

      if (!res.ok) {
        // Session expired — clear and let retry re-init
        if (res.status === 404 || res.status === 406) {
          _sessionId = null;
          _initPromise = null;
        }
        const retryable = res.status >= 500 || res.status === 404 || res.status === 406;
        console.log(JSON.stringify({
          mcp_tool: toolName,
          status: res.status,
          duration_ms: Date.now() - start,
          outcome: "client_error",
        }));
        throw Object.assign(new Error(`MCP error ${res.status}`), { retryable });
      }

      // Response may be JSON or SSE — read as text and parse
      const contentType = res.headers.get("content-type") ?? "";
      let result: { content?: Array<{ type: string; text?: string }>; isError?: boolean };

      if (contentType.includes("text/event-stream")) {
        // Parse SSE: find the data line with the result
        const text = await res.text();
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) throw new Error("MCP: empty SSE response");
        const parsed = JSON.parse(dataLine.slice(5).trim());
        result = parsed.result;
      } else {
        const json = await res.json();
        result = json.result;
      }

      console.log(JSON.stringify({
        mcp_tool: toolName,
        duration_ms: Date.now() - start,
        outcome: result?.isError ? "tool_error" : "ok",
        attempt,
      }));

      if (result?.isError) {
        throw new Error(result.content?.[0]?.text ?? "MCP tool error");
      }

      const textContent = result?.content?.find((c) => c.type === "text")?.text;
      if (!textContent) throw new Error("MCP: empty response content");

      // MCP server returns Markdown text, not JSON — pass raw string to AI
      return textContent;
    } catch (err) {
      lastError = err;
      const isRetryable = (err as { retryable?: boolean }).retryable !== false;
      console.log(JSON.stringify({
        mcp_tool: toolName,
        duration_ms: Date.now() - start,
        outcome: "error",
        attempt,
        error: String(err),
      }));
      if (!isRetryable || attempt === MAX_RETRIES) break;
    }
  }

  throw lastError;
}
