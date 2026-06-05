# Research: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`

## 1. Kapruka MCP — Live Discovery

**Decision**: Use the Kapruka MCP Streamable HTTP (SSE) transport directly from Next.js Route
Handlers. All 7 tools confirmed reachable with no authentication.

**Rationale**: The MCP endpoint is public, well-documented via `tools/list`, and returns typed
JSON schemas. Building a server-side client abstraction avoids exposing the SSE handshake
complexity to the AI orchestration layer.

**Alternatives considered**: REST API proxy — rejected because MCP tooling is already provided
and avoids custom API mapping work.

**Discovered server**: `kapruka_mcp v1.27.0`, protocol `2024-11-05`

**Connection protocol**:

1. `GET https://mcp.kapruka.com/mcp` with `Accept: text/event-stream` → capture `mcp-session-id` header
2. `POST` with `{"jsonrpc":"2.0","method":"initialize","params":{...}}` + session header
3. `POST` with `{"jsonrpc":"2.0","method":"notifications/initialized"}`
4. All subsequent `tools/call` POSTs include the session header

**Rate limits**: 60 req/min per IP (all tools); 30 `kapruka_create_order` calls/hour per IP.

---

## 2. AI Orchestration — Gemini 2.5 Flash + Vercel AI SDK

**Decision**: Use Gemini 2.5 Flash via `@google/generative-ai` wrapped with the Vercel AI SDK
(`ai` package) for streaming. Expose MCP tools as Gemini function declarations.

**Rationale**: Gemini 2.5 Flash provides fast, cost-effective inference with strong multilingual
capability including Sinhala. The Vercel AI SDK provides a unified streaming interface (`useChat`
hook) that integrates directly with Next.js streaming Route Handlers, reducing boilerplate.

**Alternatives considered**:

- GPT-4o: Strong multilingual but higher cost and no Sinhala-specific optimisation advantage
- Raw Gemini SDK without Vercel AI SDK: More control but requires manual streaming plumbing

**Tool calling strategy**: Each Kapruka MCP tool is registered as a Gemini function declaration.
When Gemini decides to call a tool, the Route Handler intercepts the function call, executes
the corresponding typed MCP wrapper, and feeds the result back into the conversation.

**System prompt**: Built per-request using `lib/ai/system-prompt.ts` with the detected locale
(en/si/ta-Latn) injected. The prompt instructs Gemini to act as a friendly shopping concierge,
respond in the user's detected language, and always return product results as structured JSON
that the UI renders as cards (never as plain text lists).

---

## 3. Multilingual Strategy — next-intl + Gemini

**Decision**: Separate UI strings (next-intl) from AI response language (Gemini system prompt).

**Rationale**: UI chrome (buttons, labels, placeholders) needs deterministic translations managed
in JSON files. AI responses need flexible, context-aware language generation. Mixing the two
would create a brittle system.

**Locale detection**: On each user message, the server inspects the text for Sinhala Unicode
block characters (U+0D80–U+0DFF) to detect Sinhala, checks for common Tanglish patterns
(Latin script with Tamil/Sinhala loanwords), and defaults to English. The detected locale is
passed to the system prompt and stored in `sessionStorage`.

**Sinhala rendering**: Noto Sans Sinhala loaded via `next/font`. NFC normalisation applied
to all Sinhala input in `lib/utils/unicode.ts` before sending to Gemini.

**Alternatives considered**: Separate translation service (e.g. Google Translate API) — rejected
because Gemini handles multilingual natively without adding API costs or latency.

---

## 4. State Management — Zustand + sessionStorage

**Decision**: Zustand for cart state, hydrated from and synced to `sessionStorage`. Vercel AI
SDK `useChat` hook for conversation state.

**Rationale**: Zustand is lightweight (< 2 kB), has no boilerplate, and integrates cleanly with
React Server Components. `sessionStorage` provides browser-tab persistence without requiring a
backend store, satisfying FR-007 (cart persists across page refreshes within a session).

**Alternatives considered**: Redux — rejected (over-engineered for this scope); React Context —
rejected (re-render performance for cart updates in a chat-heavy UI); localStorage — rejected
(persists across sessions, unwanted for guest cart data).

---

## 5. Voice I/O — Web Speech API

**Decision**: Use the browser-native Web Speech API for both speech-to-text input and
text-to-speech output. No external voice service.

**Rationale**: Zero cost, zero latency overhead from an external API, and sufficient quality for
the target use case. Safari iOS and Chrome Android both support the API. A confidence threshold
check triggers the "confirm what I heard" flow described in FR-016/FR-017 and the edge cases.

**Limitations**: Not available in Firefox desktop without a flag. Degradation: voice button hidden
when `'speechRecognition' in window` is false.

**Alternatives considered**: Whisper API (OpenAI) — rejected (adds latency, cost, and complexity);
Google Cloud Speech-to-Text — rejected (same reasons).

---

## 6. Performance Strategy

**Decision**: Streaming first, skeleton screens, Next.js Image, and strict bundle budget.

**Key choices**:

- Gemini responses stream via `text/event-stream` → Vercel AI SDK renders tokens progressively
- Product images use `next/image` with `sizes` tuned to card widths
- `loading.tsx` + React Suspense on the `/chat` route
- Dynamic imports for CartDrawer (not in initial paint path)
- No third-party analytics scripts in the critical path (Vercel Analytics is edge-injected)
- Bundle analyser (`@next/bundle-analyzer`) integrated into the dev workflow

**Target**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, Lighthouse ≥ 80 mobile.

---

## 7. MCP Client Resilience

**Decision**: Retry up to 2 times with 500 ms backoff on network errors or 5xx responses.
Log all tool calls with tool name, params summary, duration, and outcome.

**Rationale**: The MCP endpoint is a third-party service; transient failures must not surface
as hard errors. Two retries balance resilience against rate-limit compliance (60 req/min).

**Error classification**:

- Network timeout / 5xx → retry
- 4xx (bad input, product not found, city not deliverable) → surface to user immediately
- Rate limit 429 → surface friendly message; no retry

---

## 8. Checkout Flow Design

**Decision**: Collect checkout fields conversationally (one prompt per field), validate each
inline, then call `kapruka_create_order` in a single server-side request.

**Field collection order**:

1. Recipient name
2. Recipient phone (validated: E.164 or SL local format)
3. Delivery address
4. Delivery city (matched via `kapruka_list_delivery_cities`)
5. Delivery date (default: today Asia/Colombo; validated ≥ today)
6. Gift message (optional)

**Idempotency**: `kapruka_create_order` auto-generates an idempotency key per call; double-submit
from a broken connection will not duplicate the order.

**Payment URL expiry**: The 60-minute expiry is displayed to the user alongside the payment link.
