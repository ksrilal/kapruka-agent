# API Routes Contract: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`
**Last reconciled with codebase**: 2026-07-27

All routes are implemented as Next.js App Router Route Handlers under `src/app/api/`. There are
**four** routes total — the original version of this document only covered two (`/api/chat`,
`/api/health`) and omitted `/api/orders/track` and `/api/product-image`, both of which are real
and load-bearing.

---

## POST /api/chat

Streaming chat endpoint. Accepts full conversation history, runs multi-provider LLM orchestration
(Google Gemini by default, or Anthropic/OpenAI via `AI_PROVIDER`) with Kapruka MCP tool calling,
and streams a custom SSE protocol back to the client. Runs on the Node.js runtime with
`maxDuration = 60` (needs Vercel Pro).

**Content-Type**: `application/json` (request) / `text/event-stream` (response)

**Rate limit**: 60 requests / 60s per client IP, enforced in-memory (per server instance).

### Request Body

```typescript
interface ChatRequest {
  messages: Array<{
    // "model" accepted for backwards compat, normalized to "assistant" server-side
    role: "user" | "assistant" | "model";
    content: string;
  }>;
  locale?: "en" | "si" | "ta-Latn"; // optional — auto-detected from last user message if omitted
}
```

There is no `cart` field in the request body — the model does not receive a cart snapshot from
the client. Cart-affecting actions are resolved client-side against products already shown in the
current session (see `cartAction` event below).

### Response

A custom newline-delimited SSE stream (NOT the Vercel AI SDK's `StreamingTextResponse`/`useChat`
wire format). Each event is one JSON object per `data:` line, discriminated by `type`:

```
data: {"type":"tool_call","tool":"search_products","status":"running"}
data: {"type":"tool_call","tool":"search_products","status":"done"}
data: {"type":"products","products":[{...ProductSummary}]}
data: {"type":"text","text":"Here's what I found — tap any card to explore or add to cart."}
```

Other possible event shapes:

```typescript
type ChatSSEEvent =
  | { type: "tool_call"; tool: string; status: "running" | "done" }
  | { type: "text"; text: string }
  | { type: "products"; products: ProductSummary[] }
  | { type: "order"; order: Order }
  | { type: "orderStatus"; orderStatus: OrderStatus }
  | { type: "cartAction"; action: "add"; productId: string; quantity: number }
  | { type: "error"; message: string; retryable: boolean };
```

These events are derived server-side by extracting `{"__type":...}` JSON blocks (fenced in
` ```json ` or bare) that the model is instructed to emit inline in its own response text — the
route handler (`src/app/api/chat/route.ts`) parses these out, strips them from the visible text,
and re-emits them as typed events. There is no `[DONE]` sentinel or explicit tool-result echo
event; tool call status is `running`/`done` markers only, not the raw tool payload.

The client (`useChat.ts`) hand-parses this stream and dispatches into the chat/shop/cart/orders
stores accordingly.

### Error Responses

| Status | Condition                                        |
| ------ | -------------------------------------------------- |
| 400    | Missing or malformed request body (Zod validation failed) |
| 429    | This app's own rate limit exceeded (60 req/60s/IP) |
| 405    | GET/other methods not allowed on this route         |

Provider/MCP-level failures (rate limits, timeouts, unavailability) are NOT surfaced as HTTP error
statuses — they come back as `200 OK` with an in-stream `{"type":"error",...}` event instead, so
the chat UI can render an inline retry affordance without a failed fetch.

---

## GET /api/health

Liveness + configuration check. Runs on the **Edge** runtime.

### Response

```json
{
  "status": "ok",
  "ts": "2026-07-27T10:00:00.000Z",
  "env": {
    "ai_provider": "google",
    "ai_key_set": true,
    "mcp": true
  }
}
```

`ai_key_set` reflects whether a usable API key is present for the active `ai_provider` (or the
generic `AI_API_KEY` override). `mcp` reflects whether `KAPRUKA_MCP_URL` is set (not whether the
MCP is actually reachable — this is a config-presence check, not a connectivity probe).

---

## POST /api/orders/track

**Not in the original contract — real, implemented route.** A non-chat REST endpoint for looking
up order status outside the conversation, used by `useOrderPolling.ts` to refresh the Orders
panel.

### Request Body

```typescript
interface TrackOrderRequest {
  order_number: string; // 4-40 chars
}
```

### Response

```json
{ "status": { /* OrderStatus, see data-model.md */ } }
```

### Error Responses

| Status | Condition                                             |
| ------ | -------------------------------------------------------- |
| 400    | Invalid request body                                      |
| 404    | Order not found (detected from MCP error message content) |
| 500    | Unexpected error                                          |
| 502    | MCP returned a response this route could not parse/validate against `TrackOrderOutputSchema` |

---

## GET /api/product-image

**Not in the original contract — real, implemented route.** Kapruka MCP never returns
`image_url` for search results; this route scrapes the `og:image` meta tag from the live
kapruka.com product page as a fallback, since the client can't do this itself (CORS).

### Query Parameters

| Param | Required | Notes                                                                    |
| ----- | -------- | --------------------------------------------------------------------------- |
| `url` | Yes      | Must be an `https://kapruka.com/...` or `*.kapruka.com` URL — rejected otherwise |

### Response

```json
{ "image_url": "https://cdn.kapruka.com/..." }
```

`image_url` is `null` if scraping failed or no `og:image` tag was found — this is a soft failure,
always `200 OK`. Results are cached in-memory for 1 hour (per server instance, 500-entry cap) with
in-flight request deduplication.

### Error Responses

| Status | Condition                                  |
| ------ | --------------------------------------------- |
| 400    | Missing `url` param or not a kapruka.com URL |

---

## Internal: MCP Tool Execution (within /api/chat)

MCP tools are not exposed as separate HTTP routes. They are called server-side within
`runOrchestrator()` (`src/lib/ai/orchestrator.ts`), which keeps MCP session management entirely
server-side.

**Flow**:

```
POST /api/chat
  → runOrchestrator() — up to 4 tool-call rounds
    → [model requests one or more tool calls this round]
    → MCP Client: reuse cached mcp-session-id, or initialize if not yet established
    → MCP Client: tools/call → kapruka_* (parallel within a round)
    → [results injected back into conversation as a "tool" role message]
    → [repeat if the model requests more tool calls, up to 4 rounds total]
  → Extract {"__type":...} JSON blocks from final text → typed SSE events
  → Stream remaining plain text to client
```
