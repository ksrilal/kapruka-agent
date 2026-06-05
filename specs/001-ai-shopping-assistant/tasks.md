---
description: "Task list for Kiyo Shopping Assistant implementation"
---

# Tasks: Kiyo Shopping Assistant

**Input**: Design documents from `specs/001-ai-shopping-assistant/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing.
Every task is sized for 2–4 hours of focused work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every description

## Path Conventions

```text
src/app/               Next.js App Router pages and API routes
src/features/          Feature vertical slices (chat, products, cart, checkout, gifts)
src/lib/               Shared infrastructure (mcp, ai, i18n, utils)
src/components/        Shared shadcn/ui primitives and layout
src/types/             Global TypeScript interfaces
```

---

## Phase 1: Project Setup

**Purpose**: Bootstrap Next.js project, install dependencies, configure tooling, establish folder structure.

- [ ] T001 Initialise Next.js 15 App Router project with TypeScript strict mode, Tailwind, ESLint, src/ dir, and `@/*` import alias via `pnpm create next-app@latest`
- [ ] T002 [P] Install core dependencies: `@google/generative-ai ai next-intl zod zustand` in `package.json`
- [ ] T003 [P] Install UI dependencies: `@radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react` in `package.json`
- [ ] T004 [P] Install dev dependencies: `@next/bundle-analyzer vitest @playwright/test` in `package.json`
- [ ] T005 Run `pnpm dlx shadcn@latest init` and add primitives: `button card badge input sheet skeleton toast scroll-area separator` to `src/components/ui/`
- [ ] T006 Create folder structure: `src/features/{chat,products,cart,checkout,gifts}/`, `src/lib/{mcp/tools,ai,i18n/messages,utils}/`, `src/types/`, `src/components/{ui,layout,feedback}/`
- [ ] T007 Configure `tailwind.config.ts`: extend theme with Kapruka brand colours (primary saffron `#F59E0B`, neutral slate palette), add Noto Sans Sinhala font entry, set content paths
- [ ] T008 Create `.env.local` with `GEMINI_API_KEY` and `KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp` — add both to `.env.example` without values; confirm `.env.local` is in `.gitignore`
- [ ] T009 Configure `next.config.ts`: enable `images.domains` for Kapruka CDN, set `experimental.serverActions`, add bundle analyser wrapper
- [ ] T010 [P] Write `src/types/mcp.ts`: copy all 7 Kapruka MCP tool I/O interfaces from `specs/001-ai-shopping-assistant/contracts/mcp-types.ts` and add Zod schemas for each
- [ ] T011 [P] Write `src/types/domain.ts`: ProductSummary, Product, CartItem, Cart, DeliveryOption, Order, GiftProfile, ConversationMessage, ConversationState from data-model.md
- [ ] T012 [P] Write `src/types/ai.ts`: ChatRequest, ChatResponse, ToolCall, ToolResult, Locale type union `"en" | "si" | "ta-Latn"`
- [ ] T013 Configure ESLint (`eslint.config.mjs`): add `@typescript-eslint/strict`, `no-explicit-any`, `no-unused-vars` rules; configure Prettier with `.prettierrc`
- [ ] T014 [P] Write `src/lib/utils/currency.ts`: `formatLKR(amount: number): string` using `Intl.NumberFormat` for Sri Lankan Rupees
- [ ] T015 [P] Write `src/lib/utils/date.ts`: `todayInColombo(): string` (YYYY-MM-DD in Asia/Colombo), `isFutureOrToday(date: string): boolean`
- [ ] T016 [P] Write `src/lib/utils/unicode.ts`: `normalizeSinhala(text: string): string` (NFC normalisation), `detectLocale(text: string): Locale` (Unicode block detection for Sinhala U+0D80–U+0DFF, Tanglish heuristic, English default)

**Checkpoint**: `pnpm tsc --noEmit` and `pnpm lint` both exit 0. Folder structure matches plan.md.

---

## Phase 2: Foundational Infrastructure

**Purpose**: MCP client, AI orchestration, i18n config — all user stories depend on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### MCP Client Layer

- [ ] T017 Write `src/lib/mcp/client.ts`: `KaprukaMcpClient` class with `callTool(name, params)` method that (1) GET `/mcp` to get `mcp-session-id`, (2) POST `initialize`, (3) POST `tools/call`, retries up to 2× on 5xx/network error with 500 ms backoff, logs each call with tool name, duration, and outcome using `console.log` structured JSON
- [ ] T018 [P] Write `src/lib/mcp/tools/search-products.ts`: typed wrapper `searchProducts(input: SearchProductsInput): Promise<SearchProductsOutput>` using `KaprukaMcpClient`, Zod-validate output
- [ ] T019 [P] Write `src/lib/mcp/tools/get-product.ts`: typed wrapper `getProduct(input: GetProductInput): Promise<GetProductOutput>` with Zod validation
- [ ] T020 [P] Write `src/lib/mcp/tools/list-categories.ts`: typed wrapper `listCategories(input?: ListCategoriesInput): Promise<ListCategoriesOutput>`
- [ ] T021 [P] Write `src/lib/mcp/tools/list-delivery-cities.ts`: typed wrapper `listDeliveryCities(input?: ListDeliveryCitiesInput): Promise<ListDeliveryCitiesOutput>`
- [ ] T022 [P] Write `src/lib/mcp/tools/check-delivery.ts`: typed wrapper `checkDelivery(input: CheckDeliveryInput): Promise<CheckDeliveryOutput>`
- [ ] T023 [P] Write `src/lib/mcp/tools/create-order.ts`: typed wrapper `createOrder(input: CreateOrderInput): Promise<CreateOrderOutput>` — Zod-validate all nested objects before calling MCP
- [ ] T024 [P] Write `src/lib/mcp/tools/track-order.ts`: typed wrapper `trackOrder(input: TrackOrderInput): Promise<TrackOrderOutput>`
- [ ] T025 Write `src/lib/mcp/index.ts`: re-export all tool wrappers; export `mcpClient` singleton instance

### AI Orchestration Layer

- [ ] T026 Write `src/lib/ai/system-prompt.ts`: `buildSystemPrompt(locale: Locale): string` — returns the full concierge persona prompt instructing Gemini to respond in the detected locale, always return product results as structured JSON (never plain text lists), act as a friendly shopping assistant, and call MCP tools when needed
- [ ] T027 Write `src/lib/ai/tool-definitions.ts`: export `geminiToolDeclarations` array — all 7 Gemini function declarations from `specs/001-ai-shopping-assistant/contracts/ai-tools.md`, typed as `Tool[]` from `@google/generative-ai`
- [ ] T028 Write `src/lib/ai/orchestrator.ts`: `createChatOrchestrator(locale: Locale)` that initialises `GoogleGenerativeAI` with Gemini 2.5 Flash, registers the tool declarations, and returns a `chat` session with the locale-aware system prompt
- [ ] T029 Write `src/lib/ai/streaming.ts`: `streamToResponse(stream: AsyncIterable<string>): Response` helper that converts Gemini's streaming output to a `text/event-stream` `Response` compatible with Vercel AI SDK `useChat`

### i18n Setup

- [ ] T030 [P] Write `src/lib/i18n/messages/en.json`: all English UI strings (labels, placeholders, error messages, button text, assistant greeting); MUST include `chat.error.retry` key ("I'm having trouble right now — tap to retry")
- [ ] T031 [P] Write `src/lib/i18n/messages/si.json`: Sinhala translations for all strings in `en.json` (use Unicode Sinhala script; NFC normalised)
- [ ] T032 [P] Write `src/lib/i18n/messages/ta-Latn.json`: Tanglish translations for all strings in `en.json` (Tamil intent expressed in Latin/English script)
- [ ] T033 Write `src/lib/i18n/config.ts`: `next-intl` configuration — supported locales `["en", "si", "ta-Latn"]`, default locale `"en"`, messages loader

### API Route Handler

- [ ] T034 Write `src/app/api/chat/route.ts`: streaming POST handler — parse `ChatRequest`, detect locale via `detectLocale`, build orchestrator, handle Gemini tool calls by routing to the appropriate MCP wrapper, stream response tokens back as `text/event-stream`; return 400 for bad body, 503 if MCP unreachable after retries, 429 if rate limited; on Gemini API error emit a structured `{ type: "error", retryable: true, message: "..." }` SSE event (never a full-page error); MUST NOT log checkout field values (name, phone, address) — log only tool name, status code, and duration
- [ ] T035 Write `src/app/api/health/route.ts`: GET handler returning `{ status: "ok", timestamp: new Date().toISOString() }`

### Shared Components

- [ ] T036 [P] Write `src/components/layout/AppShell.tsx`: full-viewport flex container (`h-dvh`, `overflow-hidden`) with optional sticky header slot; mobile-safe-area-inset padding
- [ ] T037 [P] Write `src/components/layout/Header.tsx`: app name, cart item count badge, locale selector (en/si/ta-Latn icon buttons); mobile-first, height 56 px, `touch-manipulation`
- [ ] T038 [P] Write `src/components/feedback/ErrorBoundary.tsx`: React error boundary with user-friendly fallback UI and "Try again" button
- [ ] T039 [P] Write `src/components/feedback/Toast.tsx`: re-export and configure shadcn/ui `Toaster` with Kapruka colour tokens

**Checkpoint**: Foundational phase ready — confirm MCP connectivity with a direct `searchProducts({ q: "cake" })` call from a test script. All MCP wrappers return typed data.

---

## Phase 3: User Story 1 — Conversational Product Discovery (P1) 🎯 MVP

**Goal**: User types a query → assistant returns rich product cards within 3 seconds.

**Independent Test**: Open `/chat`, type "birthday cake under 3000 rupees", verify product cards with images, names, prices, and Add-to-Cart buttons appear without page navigation.

### Implementation for User Story 1

- [ ] T040 [US1] Write `src/features/chat/types.ts`: `ChatMessage` (id, role, content, locale, timestamp, embedded `products?: ProductSummary[]`), `ChatUIState`
- [ ] T041 [P] [US1] Write `src/features/chat/hooks/useChat.ts`: wrap Vercel AI SDK `useChat` with the `/api/chat` endpoint; parse `tool_result` SSE events to extract embedded product arrays; expose `messages`, `input`, `handleSubmit`, `isLoading`, `embeddedProducts`
- [ ] T042 [P] [US1] Write `src/features/products/types.ts`: re-export `ProductSummary` and `Product` from `src/types/domain.ts`; add `ProductCardProps`
- [ ] T043 [P] [US1] Write `src/features/products/components/ProductSkeleton.tsx`: animated skeleton card matching ProductCard dimensions; uses shadcn/ui `Skeleton`; responsive width
- [ ] T044 [US1] Write `src/features/products/components/ProductCard.tsx`: displays `ProductSummary` — `next/image` with `alt`, name, price formatted via `formatLKR`, stock badge, "Add to Cart" button (shadcn/ui `Button`); touch target ≥ 44 × 44 px; `aria-label` on CTA; mobile-first 160 px wide card
- [ ] T045 [US1] Write `src/features/products/components/ProductCarousel.tsx`: horizontal scroll container of `ProductCard` components; `overflow-x-auto`, `scroll-snap-type: x mandatory`, gap-3; renders `ProductSkeleton` when `isLoading`; `aria-label="Product results"`
- [ ] T046 [US1] Write `src/features/chat/components/MessageBubble.tsx`: renders a single `ChatMessage` — user bubble (right-aligned, primary colour), assistant bubble (left-aligned, neutral); if message contains embedded products, renders `ProductCarousel` inline below the text; supports markdown-lite bold/italic
- [ ] T047 [US1] Write `src/features/chat/components/MessageList.tsx`: scrollable `<ul>` of `MessageBubble` components; auto-scrolls to bottom on new message; `aria-live="polite"` for screen readers; shows `TypingIndicator` when `isLoading`
- [ ] T048 [US1] Write `src/features/chat/components/TypingIndicator.tsx`: three-dot animated indicator using Tailwind `animate-bounce` with staggered delays; `aria-label="Assistant is typing"`
- [ ] T048b [US1] Write `src/features/chat/components/ChatErrorBubble.tsx`: inline error message rendered as an assistant bubble when a `retryable` SSE error event is received — displays "I'm having trouble right now" copy (i18n key `chat.error.retry`), a "Retry" button that re-submits the last user message, and preserves all prior conversation history and cart state; `aria-live="assertive"` for screen readers
- [ ] T049 [US1] Write `src/features/chat/components/MessageInput.tsx`: sticky-bottom text input + submit button; Enter to send, Shift+Enter for newline; disabled while streaming; `placeholder` i18n-aware via `next-intl`; min-height 44 px touch target
- [ ] T050 [US1] Write `src/features/chat/components/ChatInterface.tsx`: full-screen flex column — `Header` → `MessageList` (flex-grow, overflow-y-auto) → `MessageInput` (sticky bottom); composes `useChat`; wraps in `ErrorBoundary`
- [ ] T051 [US1] Write `src/app/chat/page.tsx`: renders `ChatInterface` with `AppShell`; sets page metadata; `loading.tsx` with skeleton placeholder
- [ ] T052 [US1] Write `src/app/page.tsx`: redirect to `/chat` via `next/navigation` `redirect()`
- [ ] T053 [US1] Write `src/app/layout.tsx`: root layout with `next/font` (Inter + Noto Sans Sinhala), `next-intl` provider, `Toaster`, viewport meta for mobile, `lang` attribute driven by detected locale
- [ ] T054 [US1] Write `src/features/products/components/CategoryBrowser.tsx`: grid of category name chips from `listCategories()` output; tapping a chip inserts the category name as a chat message; `aria-label` per chip; skeleton while loading

**Checkpoint**: User Story 1 is independently testable — product discovery works end-to-end in conversation. Run `pnpm dev` and validate the happy path from quickstart.md step 6.

---

## Phase 4: User Story 2 — Cart Management (P2)

**Goal**: User adds products to cart via conversation or card CTA; views, updates, and removes items.

**Independent Test**: Add two products via chat ("add the first one"), say "remove the cake", confirm cart badge updates and running total is correct.

### Implementation for User Story 2

- [ ] T055 [US2] Write `src/features/cart/types.ts`: `CartItem`, `Cart`, `CartAction` union type
- [ ] T056 [US2] Write `src/features/cart/store.ts`: Zustand store with `items: CartItem[]`; actions `addItem(product, qty)`, `removeItem(productId)`, `updateQty(productId, qty)`, `clearCart()`; computed `subtotal` and `item_count`; persist to `sessionStorage` via `zustand/middleware/persist` with `skipHydration: false` so re-hydration runs synchronously before first paint — no empty-cart flash on page refresh
- [ ] T057 [US2] Write `src/features/cart/hooks/useCart.ts`: thin hook wrapping the Zustand store; validates qty 1–99 and cart ≤ 30 items on `addItem`; shows `Toast` on add/remove
- [ ] T058 [P] [US2] Write `src/features/cart/components/CartItem.tsx`: single row — product thumbnail, name, price × qty, quantity stepper (−/+), remove button; all touch targets ≥ 44 × 44 px; `aria-label` on stepper buttons
- [ ] T059 [P] [US2] Write `src/features/cart/components/CartSummary.tsx`: subtotal display, item count, "Proceed to Checkout" button (disabled if cart empty); `formatLKR` for prices
- [ ] T060 [US2] Write `src/features/cart/components/CartDrawer.tsx`: shadcn/ui `Sheet` (side drawer) containing list of `CartItem` + `CartSummary`; triggered by cart icon in `Header`; slide-in animation; `aria-label="Shopping cart"`
- [ ] T061 [US2] Update `src/features/chat/components/ProductCard.tsx`: wire "Add to Cart" button to `useCart().addItem()`; show filled cart icon and quantity badge when product is already in cart
- [ ] T062 [US2] Update `src/components/layout/Header.tsx`: wire cart icon to open `CartDrawer`; show live `item_count` badge from Zustand store; badge animates on count change (scale pulse)
- [ ] T063 [US2] Update `src/app/api/chat/route.ts`: include cart snapshot in the system context sent to Gemini so the AI knows what's in the cart when the user asks "what's in my cart?" — pass cart items as a JSON block in the system prompt extension

**Checkpoint**: Add 2 products, refresh the page, verify cart persists (sessionStorage). Remove one item via "remove [name]" in chat.

---

## Phase 5: User Story 3 — Delivery Check and Checkout (P3)

**Goal**: User specifies delivery city → assistant checks availability → guided guest checkout → payment URL in chat.

**Independent Test**: With items in cart, say "deliver to Kandy", verify delivery fee + date shown, complete checkout fields conversationally, verify payment URL and order_ref appear.

### Implementation for User Story 3

- [ ] T064 [US3] Write `src/features/checkout/types.ts`: `CheckoutFormState` (recipientName, recipientPhone, deliveryAddress, deliveryCity, deliveryDate, locationType, giftMessage, senderName), `CheckoutStep` enum
- [ ] T065 [P] [US3] Write `src/features/checkout/hooks/useCheckout.ts`: manages multi-step form state; `validatePhone(phone: string): boolean` (E.164 or SL local `07x` format); `validateDate(date: string): boolean` (today or future, Asia/Colombo)
- [ ] T066 [P] [US3] Write `src/features/checkout/components/DeliveryWidget.tsx`: city search input (calls `listDeliveryCities` on debounced input, 300 ms), result dropdown list, date picker (min = today Colombo time); emits `onCitySelected` and `onDateSelected` callbacks; `aria-label` on all controls
- [ ] T067 [US3] Write `src/features/checkout/components/CheckoutForm.tsx`: renders current checkout field prompt as a chat-bubble-style form; one field at a time in sequence; validates before advancing; "Back" button to previous field; shows `DeliveryWidget` for city/date fields
- [ ] T068 [US3] Write `src/features/checkout/components/OrderConfirmation.tsx`: displays `Order.checkout_url` as a prominent CTA button, `order_ref`, grand total, delivery fee, expiry countdown (60 min from `expires_at`); share button (navigator.share API with fallback copy-to-clipboard)
- [ ] T069 [US3] Update `src/lib/ai/system-prompt.ts`: add checkout flow instructions — when user mentions a delivery city, call `check_delivery`; collect fields one at a time in order; call `create_order` only when all fields are validated; include the MCP `CreateOrderErrorCode` handling guidance
- [ ] T070 [US3] Update `src/app/api/chat/route.ts`: handle `create_order` tool result — extract `checkout_url`, `order_ref`, `summary`, `expires_at` and embed as a structured `OrderConfirmation` event in the SSE stream so the client can render `OrderConfirmation` component inline in chat
- [ ] T071 [US3] Update `src/features/chat/components/MessageBubble.tsx`: detect `orderConfirmation` payload in message; render `OrderConfirmation` component inline

**Checkpoint**: Full checkout flow works end-to-end. payment URL is valid and clickable. Order ref is displayed. Delivery unavailability shows alternative cities.

---

## Phase 6: User Story 4 — Gift Recommendation Assistant (P4)

**Goal**: User describes a gift recipient → assistant returns 3+ curated, reasoned gift options.

**Independent Test**: Type "gift for my mother's 60th birthday, budget 5000 rupees" → assistant presents ≥3 products with one-line rationale each, all within ±10% of budget.

### Implementation for User Story 4

- [ ] T072 [US4] Write `src/features/gifts/types.ts`: `GiftProfile` (occasion, recipientAge?, recipientGender?, budgetMin?, budgetMax?, notes?)
- [ ] T073 [US4] Write `src/features/gifts/components/GiftProfileForm.tsx`: optional quick-fill widget that appears when Gemini detects gift intent; chips for common occasions (Birthday, Anniversary, Wedding, New Baby), age range slider, budget range input; submits as a structured message to the chat
- [ ] T074 [US4] Write `src/features/gifts/components/GiftBundle.tsx`: display a grouped set of `ProductCard` components with a combined price total; "Add All to Cart" button; `aria-label="Gift bundle"`
- [ ] T075 [US4] Update `src/lib/ai/system-prompt.ts`: add gift recommendation persona instructions — when gift intent is detected, extract `GiftProfile` fields from conversation, call `search_products` with `max_price` filter, return results with one-line rationale for each in a structured JSON block; detect "make a bundle" intent and group selected products

**Checkpoint**: Gift flow works. Budget filtering respected. Bundle grouping works with combined price.

---

## Phase 7: User Story 5 — Order Tracking (P5)

**Goal**: User provides order number → assistant returns current status and delivery timeline.

**Independent Test**: Say "track my order", provide a valid order number (e.g. `VIMP34456CB2`), verify status and progress steps are displayed. Provide invalid number, verify friendly error.

### Implementation for User Story 5

- [ ] T076 [US5] Update `src/lib/ai/system-prompt.ts`: add tracking instructions — when user asks to track an order, ask for order number if not provided; remind user to use the number from the confirmation email (not the checkout ref); call `track_order`; display status and progress timeline clearly
- [ ] T077 [US5] Write `src/features/chat/components/OrderStatusCard.tsx`: inline chat component rendering `TrackOrderOutput` — status badge (colour-coded by status value), recipient summary, progress timeline (vertical stepper), delivery date, items list; `aria-label="Order status"`
- [ ] T078 [US5] Update `src/features/chat/components/MessageBubble.tsx`: detect `orderStatus` payload in message data; render `OrderStatusCard` inline

**Checkpoint**: Order tracking works for both valid and invalid order numbers.

---

## Phase 8: Sinhala, Tanglish, and Voice Support (P1 quality gates)

**Goal**: Trilingual input/output and browser-native voice I/O.

**Independent Test**: Type a Sinhala query → response in Sinhala with correct Unicode. Type Tanglish → response in Tanglish. Tap microphone → speak a query → transcript appears in input → assistant responds.

### Implementation

- [ ] T079 [P] Write `src/features/chat/hooks/useVoice.ts`: `useVoiceInput()` — wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition`; returns `{ isListening, transcript, confidence, start(), stop(), isSupported }`; sets `lang` attribute from current locale (`si-LK` for Sinhala, `ta-LK` for Tanglish, `en-US` default); hides voice button when `!isSupported`
- [ ] T080 [P] Write voice output in `src/features/chat/hooks/useVoice.ts`: `useVoiceOutput()` — wraps `window.speechSynthesis`; `speak(text: string, locale: Locale)` selects appropriate voice; `stop()` cancels playback; returns `{ isSpeaking, speak, stop, isSupported }`
- [ ] T081 [US1] Update `src/features/chat/components/MessageInput.tsx`: add microphone button (hidden if `!isSupported`); on tap, starts `useVoiceInput`; on stop/silence, populates input field with transcript; if confidence < 0.7 show "Did you mean: [transcript]?" confirmation chip before submitting
- [ ] T082 [US1] Update `src/features/chat/components/MessageBubble.tsx`: add speaker icon on assistant messages; tapping speaks the message text via `useVoiceOutput` in the current locale
- [ ] T083 Update `src/app/api/chat/route.ts`: ensure `detectLocale` result is included in Gemini system prompt for every request so the AI always responds in the user's current language
- [ ] T084 Update `src/lib/i18n/messages/si.json` and `ta-Latn.json`: review all strings added in Phase 2 i18n setup and ensure they are complete and natural-sounding (audit against `en.json` key list)
- [ ] T085 Update `src/app/layout.tsx`: add `<link rel="preload">` for Noto Sans Sinhala woff2 subset; set `lang` attribute dynamically from locale context

**Checkpoint**: Run all three language scenarios from quickstart.md step 7. Voice input round-trip works on Chrome Android.

---

## Phase 9: Polish, Animations, and Performance

**Purpose**: Cross-cutting improvements across all user stories.

- [ ] T086 [P] Add Tailwind CSS animations to `tailwind.config.ts`: `fade-in` (opacity 0→1, 200 ms), `slide-up` (translateY 8px→0, 200 ms), `scale-in` (scale 0.95→1, 150 ms); apply `animate-fade-in` to `MessageBubble`, `animate-slide-up` to `ProductCard`, `animate-scale-in` to `CartDrawer`
- [ ] T087 [P] Add product card hover/active states: scale 1.02 on hover (desktop), scale 0.98 active press state (touch); CSS `transition: transform 150ms ease`; ensure `prefers-reduced-motion` media query disables scale transforms
- [ ] T088 [P] Implement `src/features/products/components/ProductGrid.tsx`: 2-col responsive grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`); renders `ProductCard` or `ProductSkeleton`; used as alternative to carousel when ≥6 results
- [ ] T089 Add `next/image` `priority` prop to first 4 product images in carousel/grid; configure `sizes` prop: `(max-width: 768px) 160px, (max-width: 1280px) 200px, 240px`
- [ ] T090 [P] Wrap `CartDrawer` import in `src/features/chat/components/ChatInterface.tsx` with `dynamic(() => import(...), { ssr: false })` to exclude from initial bundle
- [ ] T091 Add `loading.tsx` to `src/app/chat/`: renders `AppShell` with `MessageList` showing 3 `MessageBubble` skeletons
- [ ] T092 [P] Run `@next/bundle-analyzer`: `ANALYZE=true pnpm build`; confirm main JS chunk < 250 kB gzipped; document any oversized dependencies
- [ ] T093 [P] Run Lighthouse mobile simulation on `/chat`; target Performance ≥ 80, Accessibility ≥ 90, LCP ≤ 2.5 s; fix any failing items
- [ ] T094 [P] Validate responsive layout at 375 px, 768 px, 1280 px: confirm `ChatInterface`, `ProductCarousel`, `CartDrawer`, and `OrderConfirmation` render correctly at all widths
- [ ] T095 [P] Run axe accessibility audit on primary flows (product discovery, cart, checkout); fix all WCAG 2.1 AA violations; confirm colour contrast ≥ 4.5:1 for all text
- [ ] T096 Audit all i18n keys: run a script to confirm every key in `en.json` exists in `si.json` and `ta-Latn.json`; add any missing translations
- [ ] T097 [P] Write `src/app/api/health/route.ts` smoke test: `curl /api/health` returns 200 with `{ status: "ok" }`; add to Vercel deployment check
- [ ] T098 Write `DEPLOYMENT.md` at repo root: Vercel env vars required, deployment steps, Kapruka MCP rate limit reminders, quickstart validation checklist reference

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user story phases**
- **Phase 3 (US1 — Product Discovery)**: Depends on Phase 2 — first MVP milestone
- **Phase 4 (US2 — Cart)**: Depends on Phase 3 (needs ProductCard for Add-to-Cart wiring)
- **Phase 5 (US3 — Checkout)**: Depends on Phase 4 (needs Cart state for order creation)
- **Phase 6 (US4 — Gifts)**: Depends on Phase 3 (reuses product search + cards)
- **Phase 7 (US5 — Tracking)**: Depends on Phase 2 only (self-contained MCP call)
- **Phase 8 (Multilingual + Voice)**: Depends on Phase 3 (updates chat components)
- **Phase 9 (Polish)**: Depends on all user story phases being complete

### Within Each Phase

- [P]-marked tasks within a phase run in parallel
- Non-[P] tasks run sequentially (depend on earlier tasks in the same phase)

### Parallel Opportunities (Phase 2 example)

```bash
# These 7 MCP tool wrappers can all be written simultaneously:
T018 search-products.ts
T019 get-product.ts
T020 list-categories.ts
T021 list-delivery-cities.ts
T022 check-delivery.ts
T023 create-order.ts
T024 track-order.ts

# These i18n files can be written simultaneously:
T030 en.json
T031 si.json
T032 ta-Latn.json
```

---

## Implementation Strategy

### MVP First (User Story 1 only — Phase 1 + 2 + 3)

1. Complete Phase 1: Project Setup (T001–T016)
2. Complete Phase 2: Foundational Infrastructure (T017–T039)
3. Complete Phase 3: US1 — Product Discovery (T040–T054)
4. **STOP and VALIDATE**: Can a user find a product and see rich cards in the chat?
5. Deploy to Vercel for judge preview

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (Product Discovery) → **MVP demo-able**
3. US2 (Cart) → add-to-cart works
4. US3 (Checkout) → full purchase journey complete
5. US4 (Gifts) → differentiator feature live
6. US5 (Tracking) → post-purchase support added
7. Phase 8 (Multilingual + Voice) → full challenge compliance
8. Phase 9 (Polish) → production-quality finish

### Parallel Team Strategy (if applicable)

Once Phase 2 is complete:

- Developer A: Phase 3 (US1 — Chat UI + Product cards)
- Developer B: Phase 4 (US2 — Cart store + drawer)
- Developer C: Phase 5 (US3 — Checkout flow)

---

## Notes

- [P] tasks = different files, no intra-phase dependencies; safe to parallelise
- [USn] label maps each task to its user story for traceability
- Each user story phase ends with a **Checkpoint** — validate independently before moving on
- All tasks sized for 2–4 hours of focused implementation
- Run `pnpm tsc --noEmit && pnpm lint` after completing each phase
- Constitution quality gates must pass before merging: type check, lint, format, responsive, a11y, i18n coverage, error states, Lighthouse ≥ 80
