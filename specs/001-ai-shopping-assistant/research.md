# Research: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`
**Last reconciled with codebase**: 2026-07-27

> This document records the original pre-build research and decisions. Several decisions were
> later changed during implementation; those are marked **[CHANGED]** inline with what actually
> shipped instead.

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

## 2. AI Orchestration — Vercel AI SDK, multi-provider **[CHANGED]**

**Original decision**: Use `models/gemini-3.5-flash` via `@google/generative-ai` wrapped with the
Vercel AI SDK for streaming.

**What actually shipped**: The Vercel AI SDK (`ai` v6) `generateText()` API is used directly with
a runtime-selected provider — `@ai-sdk/google` (default), `@ai-sdk/anthropic`, or `@ai-sdk/openai`
— chosen via the `AI_PROVIDER` env var (`src/lib/ai/orchestrator.ts`). The raw
`@google/generative-ai` SDK is not used at all. Default models: `models/gemini-2.0-flash` (Google),
`claude-sonnet-4-6` (Anthropic), `gpt-4o` (OpenAI) — all overridable via env vars. This was a
deliberate widening from "Gemini-only" to "provider-agnostic," not an accident, but it means this
document's original framing (Gemini vs. GPT-4o as mutually exclusive alternatives) is inverted:
both are now supported simultaneously, switchable at deploy time.

**Rationale for the change**: Provider outages/quota limits could be worked around without a code
change; different deployments (e.g. challenge judging vs. production) could use different
providers without a redeploy of orchestration logic.

**Tool calling strategy**: Each Kapruka MCP tool is registered as an AI-SDK tool via a Zod schema
(`zodSchema()` in `tool-definitions.ts`), not a raw Gemini function declaration — this is what
makes the same tool set work unmodified across all three providers. When the model calls a tool,
`runOrchestrator()` intercepts it, executes the corresponding typed MCP wrapper, and feeds the
result back into the conversation (up to 4 rounds, tool calls within a round run in parallel).

**System prompt**: Built per-request using `lib/ai/system-prompt.ts` with the detected locale
(en/si/ta-Latn) injected. The prompt instructs the model to act as "Kiyo," a friendly shopping
concierge, respond in the user's detected language, and always return product/order/cart results
as structured `{"__type":...}` JSON blocks that `/api/chat/route.ts` extracts and the UI renders
as cards (never as plain text lists). This part of the original decision held.

---

## 3. Multilingual Strategy — next-intl + LLM **[CHANGED — next-intl half never shipped]**

**Original decision**: Separate UI strings (next-intl) from AI response language (system prompt).

**What actually shipped**: Only the second half. AI response language is fully handled by the
system prompt as planned. `next-intl` was never installed, and while `src/lib/i18n/messages/`
(en/si/ta-Latn JSON) and `src/lib/i18n/config.ts` exist in the repo, nothing imports them — all
static UI chrome (buttons, labels, page copy) is English-only today. This is the single largest
gap between this document's plan and the shipped app.

**Rationale (as originally written, still valid if this is revisited)**: UI chrome needs
deterministic translations managed in JSON files; AI responses need flexible, context-aware
language generation; mixing the two would create a brittle system.

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

## 5. Voice I/O — Web Speech API **[CHANGED — output half never shipped]**

**Original decision**: Use the browser-native Web Speech API for both speech-to-text input and
text-to-speech output. No external voice service.

**What actually shipped**: Speech-to-text input only, implemented in `CommandBar.tsx` via
`SpeechRecognition`/`webkitSpeechRecognition`. There is no text-to-speech/voice output anywhere in
the codebase — no `SpeechSynthesis` usage, no audio playback of assistant responses. The
"confirm what I heard" correction flow (FR-016 edge case) was not verified as separately
implemented beyond normal text-editing of the transcribed input.

**Rationale (input half)**: Zero cost, zero latency overhead from an external API, sufficient
quality for the target use case, and native support in Safari iOS/Chrome Android.

**Limitations**: Not available in Firefox desktop without a flag.

---

## 6. Performance Strategy **[PARTIALLY VERIFIED]**

**Decision**: Streaming first, skeleton screens, Next.js Image, and strict bundle budget.

**Key choices — as actually implemented**:

- Responses stream via a custom `text/event-stream` protocol (`createSSEStream`, hand-parsed
  client-side in `useChat.ts`) — not the Vercel AI SDK's built-in streaming helpers as this
  section originally implied.
- Product images: since Kapruka MCP never returns `image_url`, images are backfilled via a
  server-side `og:image` scrape proxy (`/api/product-image`) and consumed through
  `useProductImage.ts`. Whether `next/image` is used for final rendering was not re-verified in
  this pass.
- There is no `/chat` route (`loading.tsx`/Suspense boundaries described here don't apply — the
  chat UI is the home route `/`).
- `@next/bundle-analyzer` is present in `package.json` dev dependencies, confirming the bundle
  analyser choice.
- No automated Lighthouse/CWV check exists in CI to confirm the stated targets are actually met.

**Target (unverified by CI)**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, Lighthouse ≥ 80 mobile.

---

## 7. MCP Client Resilience

**Decision**: Retry up to 2 times on network errors or 5xx responses (actual backoff in
`src/lib/mcp/client.ts` is 300 ms, not the 500 ms originally planned). Tool call outcomes are
logged via structured `console.error` on failure; there is no full per-call success/duration log
as originally described — only failures are logged.

**Rationale**: The MCP endpoint is a third-party service; transient failures must not surface
as hard errors. Two retries balance resilience against rate-limit compliance (60 req/min).

**Error classification**:

- Network timeout / 5xx → retry
- 4xx (bad input, product not found, city not deliverable) → surface to user immediately
- Rate limit 429 → surface friendly message; no retry

---

## 8. Checkout Flow Design

**Decision**: Collect checkout fields conversationally (one prompt per field), validate each
inline, then call `kapruka_create_order` in a single server-side request. This is implemented
entirely as behavioral guidance in `system-prompt.ts` plus the `create_order` tool's Zod schema —
there is no dedicated stepwise checkout form component (the `checkout/` feature folder from the
original plan does not exist).

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
