# Implementation Plan: Kiyo Shopping Assistant

**Branch**: `001-ai-shopping-assistant` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ai-shopping-assistant/spec.md`

## Summary

Build Sri Lanka's best conversational AI shopping assistant powered by models/gemini-3.5-flash and the
Kapruka MCP (v1.27.0). The assistant guides users — gift shoppers, busy professionals,
last-minute buyers, Sinhala/Tanglish speakers, and mobile users — through a full shopping
journey entirely within a chat interface: product discovery → cart management → delivery check
→ guest checkout → order confirmation. The UI is full-screen, mobile-first, and driven by rich
product cards and interactive widgets. The architecture follows clean feature-based layering
with a typed MCP abstraction, an AI orchestration layer, and a reusable shadcn/ui component
system deployed to Vercel.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS

**Primary Dependencies**:

- Next.js 15 (App Router, Server Actions, Route Handlers)
- models/gemini-3.5-flash via `@google/generative-ai` SDK
- Kapruka MCP v1.27.0 via Streamable HTTP (SSE) transport — no auth required
- shadcn/ui + Radix UI primitives
- Tailwind CSS 3.x
- Zod (runtime schema validation at all API boundaries)
- `next-intl` (i18n: en, si, ta-Latn)
- Vercel AI SDK (`ai` package) for streaming chat
- Web Speech API (browser-native voice I/O — no external service)

**Storage**: No persistent database. Session state via `sessionStorage` (cart, conversation
history, locale). No server-side state store required for v1. Cart MUST be re-hydrated
synchronously from `sessionStorage` before first paint (no empty-cart flash on refresh).
Guest checkout PII (name, phone, address) is forwarded to Kapruka MCP only — never logged
or stored server-side by this application.

**Testing**: Vitest (unit), Playwright (E2E critical paths)

**Target Platform**: Web — Vercel Edge/Node.js runtime. Primary target: mobile browsers
(Chrome Android, Safari iOS). Secondary: desktop Chrome/Firefox/Safari.

**Project Type**: Full-stack web application (Next.js monorepo)

**Performance Goals**:

- First assistant response token streaming within 1 s of message submit
- Full product card render within 3 s on 4G mobile
- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (Core Web Vitals)
- Lighthouse Performance ≥ 80 on mobile simulation

**Constraints**:

- Kapruka MCP rate limit: 60 req/min per IP; 30 `kapruka_create_order` calls/hour per IP
- `kapruka_create_order` payment URL expires after 60 minutes
- MCP requires SSE handshake per server-side call (GET → initialize → POST)
- Cart capped at 30 items, qty ≤ 99 per item
- Guest-only checkout; no user authentication in v1
- GEMINI_API_KEY in Vercel env vars only — never in client bundle
- Gemini API failures MUST surface as an inline chat error with retry action; conversation
  history and cart state MUST be preserved — no full-page error or reload
- Guest checkout PII MUST NOT be logged or retained server-side; forward to Kapruka MCP only

**Scale/Scope**: Single-feature web app targeting challenge judges + early adopters.
Estimated concurrent users: < 100 during challenge window.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                           | Status  | Notes                                                                  |
| ----------------------------------- | ------- | ---------------------------------------------------------------------- |
| I. User Experience First            | ✅ PASS | Full-screen conversational UX; every decision starts from user journey |
| II. Mobile-First Design             | ✅ PASS | 320 px baseline, touch targets enforced, min-width breakpoints         |
| III. Visual Shopping Experience     | ✅ PASS | Rich product cards mandatory; no text-list responses for products      |
| IV. Conversational Commerce         | ✅ PASS | Gemini orchestrates context-preserving, action-oriented turns          |
| V. Accessibility & Inclusiveness    | ✅ PASS | WCAG 2.1 AA target; Lighthouse a11y ≥ 90 quality gate                  |
| VI. Sinhala/English/Tanglish        | ✅ PASS | next-intl for UI strings; Gemini handles trilingual responses          |
| VII. Production-Quality Code        | ✅ PASS | TypeScript strict, ESLint + Prettier CI gates, no secrets in repo      |
| VIII. Type Safety & Maintainability | ✅ PASS | Zod schemas for all MCP + Gemini boundaries; generated TS interfaces   |
| IX. Performance Optimization        | ✅ PASS | Streaming responses, Next.js Image, Suspense boundaries, bundle budget |
| X. Reusable Component Architecture  | ✅ PASS | shadcn/ui primitives; features decomposed into ui/ + container layers  |

**No violations. Phase 0 research approved.**

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

### Source Code (repository root)

```text
src/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout (fonts, providers)
│   ├── page.tsx                        # Landing → redirect to /chat
│   ├── chat/
│   │   └── page.tsx                    # Full-screen chat page
│   └── api/
│       ├── chat/
│       │   └── route.ts                # POST — Gemini streaming chat handler
│       └── health/
│           └── route.ts                # GET — uptime check
│
├── features/                           # Feature-based vertical slices
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx       # Full-screen chat container
│   │   │   ├── MessageList.tsx         # Scrollable message thread
│   │   │   ├── MessageBubble.tsx       # Single message (user or assistant)
│   │   │   ├── MessageInput.tsx        # Text + voice input bar
│   │   │   └── TypingIndicator.tsx     # Streaming indicator
│   │   ├── hooks/
│   │   │   ├── useChat.ts              # Chat state + streaming (Vercel AI SDK)
│   │   │   └── useVoice.ts             # Web Speech API (input + output)
│   │   └── types.ts
│   │
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx         # Rich product card (image, price, CTA)
│   │   │   ├── ProductCarousel.tsx     # Horizontal scroll of ProductCards
│   │   │   ├── ProductGrid.tsx         # 2-col mobile grid
│   │   │   ├── ProductSkeleton.tsx     # Loading skeleton
│   │   │   └── CategoryBrowser.tsx    # Category grid widget
│   │   └── types.ts
│   │
│   ├── cart/
│   │   ├── components/
│   │   │   ├── CartDrawer.tsx          # Slide-in cart panel
│   │   │   ├── CartItem.tsx            # Single cart item row
│   │   │   └── CartSummary.tsx         # Totals + checkout CTA
│   │   ├── hooks/
│   │   │   └── useCart.ts              # Cart state (sessionStorage-backed)
│   │   ├── store.ts                    # Zustand cart store
│   │   └── types.ts
│   │
│   ├── checkout/
│   │   ├── components/
│   │   │   ├── DeliveryWidget.tsx      # City search + date picker
│   │   │   ├── CheckoutForm.tsx        # Conversational field collection
│   │   │   └── OrderConfirmation.tsx   # Payment URL + order ID display
│   │   ├── hooks/
│   │   │   └── useCheckout.ts
│   │   └── types.ts
│   │
│   └── gifts/
│       ├── components/
│       │   ├── GiftProfileForm.tsx     # Recipient description widget
│       │   └── GiftBundle.tsx          # Bundle display with combined price
│       └── types.ts
│
├── lib/                                # Shared infrastructure
│   ├── mcp/
│   │   ├── client.ts                   # MCP SSE session manager + retry
│   │   ├── tools/
│   │   │   ├── search-products.ts
│   │   │   ├── get-product.ts
│   │   │   ├── list-categories.ts
│   │   │   ├── list-delivery-cities.ts
│   │   │   ├── check-delivery.ts
│   │   │   ├── create-order.ts
│   │   │   └── track-order.ts
│   │   └── index.ts
│   │
│   ├── ai/
│   │   ├── orchestrator.ts             # Gemini chat orchestration
│   │   ├── system-prompt.ts            # Locale-aware system prompt builder
│   │   ├── tool-definitions.ts         # Gemini function declarations
│   │   └── streaming.ts                # Vercel AI SDK stream helpers
│   │
│   ├── i18n/
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   ├── si.json
│   │   │   └── ta-Latn.json
│   │   └── config.ts
│   │
│   └── utils/
│       ├── currency.ts                 # LKR formatting
│       ├── date.ts                     # Asia/Colombo date helpers
│       └── unicode.ts                  # Sinhala NFC normalisation
│
├── components/                         # Shared UI primitives
│   ├── ui/                             # shadcn/ui generated components
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── Header.tsx
│   └── feedback/
│       ├── ErrorBoundary.tsx
│       └── Toast.tsx
│
└── types/                              # Global TypeScript interfaces
    ├── mcp.ts                          # Kapruka MCP I/O types (Zod-derived)
    ├── ai.ts                           # Gemini + AI SDK types
    ├── domain.ts                       # Product, Cart, Order, GiftProfile, etc.
    └── i18n.ts                         # Locale types
```

**Structure Decision**: Next.js App Router monorepo with feature-based vertical slices under
`src/features/`. Shared infrastructure (MCP client, AI orchestration, i18n, utilities) lives in
`src/lib/`. Global shadcn/ui primitives in `src/components/`. All TypeScript interfaces for
domain objects and MCP contracts live in `src/types/`.

## Architecture Diagram

```text
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │  ChatInterface  ←→  useChat (Vercel AI SDK)        │   │
│  │  ProductCarousel / ProductCard                     │   │
│  │  CartDrawer (Zustand + sessionStorage)             │   │
│  │  VoiceInput / VoiceOutput (Web Speech API)         │   │
│  └──────────────────┬────────────────────────────────┘   │
└─────────────────────┼────────────────────────────────────┘
                      │ POST /api/chat  (text/event-stream)
┌─────────────────────▼────────────────────────────────────┐
│                 Next.js Server (Vercel)                    │
│  ┌─────────────────────────────────────────────────┐     │
│  │  /api/chat Route Handler                         │     │
│  │  └── AI Orchestrator (models/gemini-3.5-flash)          │     │
│  │       ├── Locale-aware system prompt             │     │
│  │       ├── Conversation history                   │     │
│  │       └── Function calls → MCP Client            │     │
│  └──────────────────┬──────────────────────────────┘     │
│                     │ SSE session (per call)              │
│  ┌──────────────────▼──────────────────────────────┐     │
│  │  MCP Client  (lib/mcp/client.ts)                 │     │
│  │  ├── GET /mcp → mcp-session-id                   │     │
│  │  ├── POST initialize                             │     │
│  │  ├── POST tools/call  (typed wrappers)           │     │
│  │  └── Retry ×2 + structured logging               │     │
│  └──────────────────┬──────────────────────────────┘     │
└─────────────────────┼────────────────────────────────────┘
                      │ HTTPS + SSE
┌─────────────────────▼────────────────────────────────────┐
│          Kapruka MCP  v1.27.0  (mcp.kapruka.com)          │
│  kapruka_search_products   kapruka_get_product            │
│  kapruka_list_categories   kapruka_list_delivery_cities   │
│  kapruka_check_delivery    kapruka_create_order           │
│  kapruka_track_order                                      │
└───────────────────────────────────────────────────────────┘
```

## State Management Strategy

| State                  | Location                       | Persistence      | Rationale                                   |
| ---------------------- | ------------------------------ | ---------------- | ------------------------------------------- |
| Conversation messages  | `useChat` (Vercel AI SDK)      | In-memory        | SDK manages streaming + history natively    |
| Cart items + totals    | Zustand store                  | `sessionStorage` | Fast sync updates; survives page refresh    |
| Active locale          | `next-intl` + `sessionStorage` | Session          | Auto-detected from message; user-selectable |
| Checkout form data     | `useCheckout` hook             | In-memory        | Short-lived; not worth persisting           |
| Product search results | Component state                | In-memory        | Always re-fetchable from MCP                |
| MCP session ID         | Server-side per-request        | Per-API call     | SSE sessions are ephemeral by design        |

## Deployment Architecture

```text
Vercel (Production)
├── Edge Network        → static assets, fonts, images (CDN)
├── Node.js Runtime     → /api/chat (streaming), /api/health
└── Environment Variables (Vercel Dashboard only — never in repo):
    ├── GEMINI_API_KEY
    └── KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp

Monitoring: Vercel Analytics + Speed Insights (built-in, zero config)
```

## Complexity Tracking

> No constitution violations found. No complexity justification required.
