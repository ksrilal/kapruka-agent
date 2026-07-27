# Implementation Plan: Kiyo Shopping Assistant

**Branch**: `001-ai-shopping-assistant` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)
**Last reconciled with codebase**: 2026-07-27

**Input**: Feature specification from `specs/001-ai-shopping-assistant/spec.md`

> **Note on this revision**: This plan was written before implementation and diverged from the
> shipped system in several material ways (AI provider, model version, framework version, file
> layout, routing). This pass rewrites it to match `src/` as it actually exists today. Historical
> planning intent that was descoped is marked, not deleted.

## Summary

Kiyo is Sri Lanka's conversational AI shopping assistant, built on the Kapruka MCP and a
provider-agnostic LLM orchestration layer (Google Gemini by default; Anthropic Claude or OpenAI
via env var). The assistant guides users through a full shopping journey entirely within a chat
interface: product discovery → cart management → delivery check → guest checkout → order
confirmation/tracking. The UI is full-screen, mobile-first, and driven by rich product cards
emitted as structured JSON blocks inside the LLM's own response text. The architecture is a thin
Next.js front end with no owned database: all catalog/order data comes from the external Kapruka
MCP server, and all client state (cart, orders, chat history, theme) lives in the browser
(`sessionStorage`/`localStorage`) via Zustand stores.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS

**Primary Dependencies** (see `package.json` for exact pinned versions):

- Next.js 16 (App Router, Route Handlers) — **not v15** as originally planned
- React 19
- AI provider: Vercel AI SDK (`ai` v6) + `@ai-sdk/google` (default), `@ai-sdk/anthropic`,
  `@ai-sdk/openai` — **not** the raw `@google/generative-ai` SDK, and **not Gemini-only**.
  Provider selected at runtime via `AI_PROVIDER` env var. Default model: `models/gemini-2.0-flash`
  (not `gemini-3.5-flash` as originally planned — that model id does not correspond to a real
  Gemini release; `orchestrator.ts` uses `gemini-2.0-flash` as the default, `claude-sonnet-4-6`
  for Anthropic, `gpt-4o` for OpenAI).
- Kapruka MCP via Streamable HTTP (JSON-RPC over HTTP with an `mcp-session-id` header) — no auth
  required. Version pin from the original discovery (`v1.27.0`) is not re-verified in this pass.
- Radix UI primitives + a `shadcn/ui`-style `components.json` config, but only `button` and
  `sonner` (toast) primitives are actually generated under `src/components/ui/` today — this is
  far less "component system" than originally planned, not a full shadcn/ui library.
- Tailwind CSS 4 — **not v3.x** as originally planned.
- Zod v4 (runtime schema validation at MCP and chat API boundaries).
- `next-intl` is **NOT installed and NOT used**. i18n message JSON files exist under
  `src/lib/i18n/messages/` but are dead code — see spec.md FR-013.
- Custom hand-rolled SSE protocol for streaming (`src/lib/ai/streaming.ts` +
  `src/features/chat/hooks/useChat.ts`) — **not** the Vercel AI SDK's `useChat`/
  `StreamingTextResponse` React helpers.
- Web Speech API — **input only** (`SpeechRecognition`). No voice output/TTS exists.

**Storage**: No persistent database, no auth, no server-side user/session store — confirmed
absent (no Prisma/Drizzle/Supabase/next-auth/Clerk in the repo). All application state is
browser-only via Zustand, split across four independently-persisted stores:

| Store | Persistence key | Backing |
| --- | --- | --- |
| Cart (`src/features/cart/store.ts`) | `kapruka-cart-v2` | `sessionStorage` |
| Orders — pending + tracked (`src/features/orders/store.ts`) | `kapruka-orders-v1` | `localStorage` |
| Chat history — last 5 sessions (`src/features/history/store.ts`) | `kiyo-history-v1` | `localStorage` |
| Theme (`src/features/theme/store.ts`) | `kiyo-theme` | `localStorage` |

Cart is re-hydrated synchronously from `sessionStorage` before first paint (no empty-cart flash),
as originally specified. Guest checkout PII (name, phone, address) is forwarded to the Kapruka
MCP only and is not logged or persisted server-side.

**Testing**: Vitest and Playwright are installed as dev dependencies, but **no test files exist
anywhere in `src/`**. Testing infrastructure is scaffolded, unused.

**Target Platform**: Web — Vercel deployment. `src/app/api/chat/route.ts` runs on the Node.js
runtime with `maxDuration = 60` (requires Vercel Pro; Hobby plan is capped at 10s — see code
comment). `src/app/api/health/route.ts` explicitly opts into the Edge runtime. Primary target:
mobile browsers (Chrome Android, Safari iOS). Secondary: desktop Chrome/Firefox/Safari.

**Project Type**: Full-stack web application, single Next.js app (not a monorepo).

**Performance Goals** (design intent — not verified by automated CI gates; no Lighthouse/CI
config exists in the repo):

- First assistant response token streaming within 1 s of message submit
- Full product card render within 3 s on 4G mobile
- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (Core Web Vitals)
- Lighthouse Performance ≥ 80 on mobile simulation

**Constraints**:

- Kapruka MCP rate limit (as documented at discovery time): 60 req/min per IP; 30
  `kapruka_create_order` calls/hour per IP. The app's own `/api/chat` rate limiter enforces 60
  requests/60s per IP (in-memory `Map`, per server instance — not distributed). There is no
  separate enforcement of the 30/hour `create_order` limit; that relies entirely on the upstream
  MCP server rejecting excess requests.
- `kapruka_create_order` payment URL expires after 60 minutes.
- MCP requires a JSON-RPC `initialize` handshake per server instance to obtain an
  `mcp-session-id`, cached in a module-level variable (`src/lib/mcp/client.ts`) — this is a
  per-serverless-instance singleton, not per-request or per-user.
- Cart capped at 30 items, qty ≤ 99 per item (MCP-side constraint, mirrored in types).
- Guest-only checkout; no user authentication exists.
- AI provider API keys (`GOOGLE_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, or the
  generic `AI_API_KEY` override) live in Vercel env vars only — never in the client bundle.
  **`GEMINI_API_KEY` is not a real variable name used anywhere in the code** — see DEPLOYMENT.md.
- AI provider failures surface as an inline chat error (SSE `error` event) with a retry action;
  conversation history and cart state are preserved — no full-page error or reload. This behavior
  is provider-agnostic, not Gemini-specific.
- Guest checkout PII is not logged or retained server-side; forwarded to Kapruka MCP only.

**Scale/Scope**: Single-feature web app originally built for the Kapruka Agent Challenge;
concurrent user scale was not re-assessed in this pass.

## Constitution Check

_Re-assessed against the shipped codebase, 2026-07-27. This replaces the original pre-build gate,
which asserted PASS for all ten principles before a line of code existed._

| Principle                           | Status     | Notes                                                                                                    |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| I. User Experience First            | ✅ PASS    | Full-screen conversational UX on `/`; every flow (search, cart, delivery, checkout, tracking) stays in-chat |
| II. Mobile-First Design             | ⚠️ UNVERIFIED | No automated viewport/responsive tests exist; visually plausible from component code but not gated by CI |
| III. Visual Shopping Experience     | ✅ PASS    | Rich product cards mandatory via the JSON-card protocol; no bare text-list product responses             |
| IV. Conversational Commerce         | ✅ PASS    | Multi-provider LLM (not Gemini-only) orchestrates context-preserving, tool-calling turns                  |
| V. Accessibility & Inclusiveness    | ⚠️ UNVERIFIED | No accessibility test suite or CI gate exists despite Vitest/Playwright being installed                  |
| VI. Sinhala/English/Tanglish        | ⚠️ PARTIAL | Chat responses are trilingual via system prompt; **no** next-intl UI-string translation layer exists      |
| VII. Production-Quality Code        | ✅ PASS    | TypeScript strict, ESLint configured; no secrets found committed to repo                                  |
| VIII. Type Safety & Maintainability | ✅ PASS    | Zod schemas at MCP + chat API boundaries; hand-written (not generated) TS interfaces in `src/types/`      |
| IX. Performance Optimization        | ⚠️ UNVERIFIED | Streaming responses implemented; no Lighthouse/CWV CI gate exists to confirm targets are met              |
| X. Reusable Component Architecture  | ⚠️ PARTIAL | `components.json` (shadcn/ui config) present, but only `button`/`sonner` primitives generated — most UI is bespoke, not shadcn-generated |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-shopping-assistant/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-routes.md
│   ├── mcp-types.ts
│   └── ai-tools.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root) — actual layout as of 2026-07-27

```text
src/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                       # Root layout: metadata, theme pre-paint script,
│   │                                     #   AppShell + ErrorBoundary + CursorGlow, Vercel Analytics
│   ├── page.tsx                         # THE chat page — home route "/". There is no /chat route;
│   │                                     #   renders EmptyState or ChatWindow depending on message count
│   ├── cart/page.tsx                    # Dedicated full cart page (in addition to slide-in CartPanel)
│   ├── about/page.tsx                   # Static marketing page
│   ├── privacy/page.tsx                 # Static page
│   ├── terms/page.tsx                   # Static page
│   ├── qa/page.tsx                      # Static help/FAQ page
│   └── api/
│       ├── chat/route.ts                # POST — streaming chat handler (SSE), all AI providers
│       ├── health/route.ts              # GET — liveness + config check (edge runtime)
│       ├── orders/track/route.ts        # POST — non-chat REST order-status lookup (JSON)
│       └── product-image/route.ts       # GET — og:image scrape proxy for kapruka.com product pages
│
├── features/                            # Feature-based vertical slices (real names, differ from
│   │                                     #   original plan's ChatInterface/MessageBubble/etc.)
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx           # Message thread container
│   │   │   ├── ChatBubble.tsx           # Single message bubble
│   │   │   ├── CommandBar.tsx           # Text input + voice input (Web Speech API)
│   │   │   ├── ThinkingIndicator.tsx    # Streaming/tool-call indicator
│   │   │   └── OrderCard.tsx            # Order/orderStatus card renderer
│   │   ├── hooks/useChat.ts             # Hand-rolled SSE parsing + store dispatch (not Vercel AI SDK's useChat)
│   │   └── store.ts                     # Zustand chat message store
│   │
│   ├── products/components/
│   │   ├── ProductCard.tsx
│   │   └── ProductCarousel.tsx          # No ProductGrid/ProductSkeleton/CategoryBrowser exist
│   │
│   ├── cart/
│   │   ├── components/CartPanel.tsx     # Slide-in drawer (no separate CartItem/CartSummary files)
│   │   └── store.ts                     # Zustand, sessionStorage-backed ("kapruka-cart-v2")
│   │
│   ├── orders/                          # NOT in original plan — real feature
│   │   ├── components/OrdersPanel.tsx   # Pending + tracked orders drawer
│   │   ├── hooks/useOrderPolling.ts     # Polls /api/orders/track for saved orders
│   │   └── store.ts                     # localStorage-backed ("kapruka-orders-v1")
│   │
│   ├── history/                         # NOT in original plan — real feature
│   │   ├── components/HistoryPanel.tsx  # Last 5 sessions, restorable
│   │   └── store.ts                     # localStorage-backed ("kiyo-history-v1")
│   │
│   ├── shop/components/EmptyState.tsx   # Landing state before first message
│   │
│   └── theme/store.ts                   # NOT in original plan — light/dark toggle, localStorage
│
│   # checkout/ and gifts/ feature folders from the original plan DO NOT EXIST.
│   # Checkout and gift-recommendation logic live entirely in the system prompt +
│   # create_order tool — no dedicated UI components for either.
│
├── lib/
│   ├── mcp/
│   │   ├── client.ts                    # JSON-RPC/Streamable-HTTP client, session cached
│   │   │                                 #   module-level (per server instance), retry x2, 8s timeout
│   │   ├── tools/                       # search-products, get-product, list-categories,
│   │   │                                 #   list-delivery-cities, check-delivery, create-order, track-order
│   │   └── index.ts
│   │
│   ├── ai/
│   │   ├── orchestrator.ts              # Multi-provider (google/anthropic/openai) tool-call loop,
│   │   │                                 #   up to 4 rounds, 20s per-call timeout, empty-turn recovery
│   │   ├── system-prompt.ts             # ~330-line Kiyo persona + JSON-card output contract
│   │   ├── tool-definitions.ts          # Zod-schema tool declarations (zodSchema()), provider-agnostic
│   │   ├── streaming.ts                 # Custom SSE stream helper (createSSEStream) — not AI SDK's
│   │   └── index.ts
│   │
│   ├── i18n/                            # DEAD CODE — next-intl not installed, not imported anywhere
│   │   ├── messages/{en,si,ta-Latn}.json
│   │   └── config.ts
│   │
│   ├── hooks/useProductImage.ts         # Client hook for the product-image scrape proxy
│   │
│   └── utils/
│       ├── currency.ts                  # Multi-currency formatting (LKR/USD/GBP/AUD/CAD/EUR)
│       ├── date.ts                      # Asia/Colombo date helpers
│       ├── markdown.tsx                 # Renders assistant markdown text
│       └── unicode.ts                   # Sinhala NFC normalisation + detectLocale()
│
├── components/
│   ├── ui/                              # Only button.tsx + sonner.tsx are shadcn-generated;
│   │                                     #   BrandLogo, Bubbles, KiyoAvatar are bespoke, not shadcn
│   └── layout/
│       ├── AppShell.tsx                 # Composes Header + CommandBar + all slide-in panels
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── CursorGlow.tsx               # Decorative cursor-follow effect
│       └── ErrorBoundary.tsx
│
└── types/
    ├── mcp.ts                           # Kapruka MCP I/O types, Zod-derived — matches data-model.md
    └── domain.ts                        # UI-facing types; re-exports/aliases MCP types where identical
    # No separate ai.ts or i18n.ts files exist.
```

**Structure Decision**: Single Next.js App Router app (not a monorepo) with feature-based vertical
slices under `src/features/`. Shared infrastructure (MCP client, AI orchestration, utilities) in
`src/lib/`. Shared UI primitives in `src/components/`. Domain/MCP TypeScript interfaces in
`src/types/`. The overall shape of this decision held up; the specific file/folder names inside it
did not.

## Architecture Diagram (actual)

```text
┌──────────────────────────────────────────────────────────────┐
│                       Browser (Client)                        │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  ChatWindow ←→ useChat (hand-rolled SSE parser)        │   │
│  │  ProductCarousel / ProductCard  (+ useProductImage)    │   │
│  │  CartPanel / OrdersPanel / HistoryPanel (Zustand)      │   │
│  │  CommandBar: text + Voice INPUT ONLY (Web Speech API)  │   │
│  └──────────────────┬──────────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────────┘
                      │ POST /api/chat  (text/event-stream, custom protocol)
                      │ POST /api/orders/track  (JSON, separate polling path)
                      │ GET  /api/product-image  (og:image scrape proxy)
┌─────────────────────▼──────────────────────────────────────────┐
│                   Next.js 16 Server (Vercel)                    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  /api/chat Route Handler (Node runtime, maxDuration=60) │    │
│  │  └── runOrchestrator() — up to 4 tool-call rounds       │    │
│  │       ├── buildSystemPrompt(locale) — ~330-line prompt  │    │
│  │       ├── AI_PROVIDER switch: google | anthropic | openai│   │
│  │       ├── Parallel tool execution per round             │    │
│  │       └── Post-hoc JSON-block extraction (products/     │    │
│  │            order/orderStatus/cartAction) from raw text  │    │
│  └──────────────────┬───────────────────────────────────┘    │
│                     │                                          │
│  ┌──────────────────▼───────────────────────────────────┐    │
│  │  MCP Client (src/lib/mcp/client.ts)                    │    │
│  │  ├── POST initialize → cache mcp-session-id            │    │
│  │  │    (module-level singleton — per server instance,   │    │
│  │  │     not per-request)                                │    │
│  │  ├── POST tools/call (7 typed wrappers)                │    │
│  │  └── Retry ×2, 8s fetch timeout                         │    │
│  └──────────────────┬───────────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼──────────────────────────────────────────┐
│              Kapruka MCP  (mcp.kapruka.com)                     │
│  search_products   get_product        list_categories           │
│  list_delivery_cities   check_delivery   create_order            │
│  track_order                                                    │
└───────────────────────────────────────────────────────────────┘
```

No database, no auth layer, and no server-side session store exist anywhere in this diagram —
this is intentional and matches the app's actual scope, not an omission.

## State Management Strategy (actual)

| State                       | Location                              | Persistence         | Notes |
| --------------------------- | -------------------------------------- | -------------------- | ----- |
| Conversation messages       | `src/features/chat/store.ts` (Zustand) | In-memory            | Custom SSE parsing in `useChat.ts`, not the Vercel AI SDK's `useChat` |
| Cart items + totals         | `src/features/cart/store.ts` (Zustand) | `sessionStorage` ("kapruka-cart-v2") | Synchronous rehydration before first paint |
| Orders (pending + tracked)  | `src/features/orders/store.ts` (Zustand) | `localStorage` ("kapruka-orders-v1") | Not in original plan |
| Chat history (last 5)       | `src/features/history/store.ts` (Zustand) | `localStorage` ("kiyo-history-v1") | Not in original plan |
| Theme (light/dark)          | `src/features/theme/store.ts` (Zustand) | `localStorage` ("kiyo-theme") | Not in original plan |
| Active locale               | Detected per-message server-side (`detectLocale()`) | Not persisted client-side | No `next-intl`; no locale selector UI |
| Product search results      | Rendered inline from SSE `products` events | In-memory | Always re-fetchable from MCP |
| MCP session ID              | Server-side, module-level variable    | Per server instance (not per-request) | Effectively a long-lived singleton until cold start |

## Deployment Architecture (actual)

```text
Vercel (Production)
├── Node.js Runtime  → /api/chat (streaming, maxDuration=60 — needs Vercel Pro)
├── Edge Runtime     → /api/health
├── Node.js Runtime  → /api/orders/track, /api/product-image
└── Environment Variables (Vercel Dashboard only — never in repo):
    ├── AI_PROVIDER              # "google" (default) | "anthropic" | "openai"
    ├── GOOGLE_API_KEY           # required if AI_PROVIDER=google (the default)
    ├── ANTHROPIC_API_KEY        # required if AI_PROVIDER=anthropic
    ├── OPENAI_API_KEY           # required if AI_PROVIDER=openai
    ├── AI_API_KEY               # generic override, takes precedence over provider-specific keys
    ├── GOOGLE_AI_MODEL / ANTHROPIC_AI_MODEL / OPENAI_AI_MODEL / AI_MODEL   # optional model-id overrides
    └── KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp

Monitoring: Vercel Analytics (@vercel/analytics, wired in layout.tsx). No Speed Insights package
found in dependencies.
```

No `vercel.json`, Dockerfile, or `.env.example` exists in the repo. See DEPLOYMENT.md for the
corrected env var reference (the previous version referenced a `GEMINI_API_KEY` variable that no
code actually reads).

## Complexity Tracking

> No constitution violations found requiring justification. Three principles (Mobile-First,
> Accessibility, Performance) are unverified rather than failing — no automated gate exists to
> check them either way; see the Constitution Check table above.
