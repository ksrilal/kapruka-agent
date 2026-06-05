# API Routes Contract: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`

All routes are implemented as Next.js App Router Route Handlers under `src/app/api/`.

---

## POST /api/chat

Streaming chat endpoint. Accepts a user message and conversation history, runs Gemini
orchestration with MCP tool calling, and streams the response.

**Content-Type**: `application/json` (request) / `text/event-stream` (response)

### Request Body

```typescript
interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  locale: "en" | "si" | "ta-Latn";
  cart?: Array<{
    // current cart snapshot for context
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}
```

### Response

Server-Sent Events stream (Vercel AI SDK `StreamingTextResponse` format):

```
data: {"type":"text","value":"Here are some birthday cakes..."}
data: {"type":"tool_call","name":"kapruka_search_products","args":{...}}
data: {"type":"tool_result","name":"kapruka_search_products","result":{...}}
data: {"type":"text","value":"I found 5 options for you."}
data: [DONE]
```

The client (`useChat` hook) renders text tokens progressively and intercepts `tool_result`
events to render product cards.

### Error Responses

| Status | Condition                             |
| ------ | ------------------------------------- |
| 400    | Missing or malformed request body     |
| 429    | Gemini or MCP rate limit exceeded     |
| 500    | Unhandled server error                |
| 503    | Kapruka MCP unreachable after retries |

---

## GET /api/health

Liveness check for Vercel deployment monitoring.

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-06-05T10:00:00.000Z"
}
```

---

## Internal: MCP Tool Execution (within /api/chat)

MCP tools are NOT exposed as separate HTTP routes. They are called server-side within the
`/api/chat` handler by the AI orchestrator. This keeps the MCP session management entirely
server-side and prevents the SSE handshake complexity from leaking to the client.

**Flow**:

```
POST /api/chat
  → AI Orchestrator (Gemini)
    → [Gemini requests tool call]
    → MCP Client: establish SSE session
    → MCP Client: tools/call → kapruka_*
    → [result injected back into Gemini conversation]
    → [repeat if multi-tool turn]
  → Stream text response to client
```
