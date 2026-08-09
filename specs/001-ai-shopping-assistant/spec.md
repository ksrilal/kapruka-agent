# Feature Specification: Kiyo Shopping Assistant

**Feature Branch**: `001-ai-shopping-assistant`

**Created**: 2026-06-05
**Last reconciled with codebase**: 2026-07-27

**Status**: Implemented (v1, with noted deferrals below)

**Input**: Build Sri Lanka's best AI shopping assistant using the Kapruka MCP to win the Kapruka Agent Challenge.

> **Note on this revision**: This spec was originally written before implementation and drifted
> from reality as the app was built. This pass reconciles it against the actual shipped code in
> `src/`. Requirements that were never built or were built differently are explicitly marked
> **[NOT IMPLEMENTED]** or **[CHANGED]** rather than silently deleted, so they remain visible as
> future options. Anything not marked is confirmed accurate as of the date above.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Conversational Product Discovery (Priority: P1)

A shopper opens the assistant, types (or speaks) what they are looking for in English, Sinhala,
or Tanglish, and the assistant surfaces relevant products as rich visual cards with images,
prices, and a direct call-to-action. The user can refine the search through follow-up messages
without starting over.

**Why this priority**: This is the core value proposition. Without working product discovery,
no other feature matters. Every other user story depends on the user being able to find a
product conversationally.

**Independent Test**: Open the assistant, type "I need a birthday cake" in English, then
"amma laga give karanna gift ekak" in Tanglish. The assistant must return product cards with
images and prices for both queries without any page navigation.

**Acceptance Scenarios**:

1. **Given** the landing page is loaded, **When** a user types a product query in English, **Then** the assistant responds within 3 seconds with at least one product card showing image, name, price, and an "Add to Cart" action.
2. **Given** a search has returned results, **When** the user sends a follow-up refinement ("under 2000 rupees"), **Then** the assistant filters results without losing conversation context.
3. **Given** a Sinhala-speaking user, **When** they type a query in Sinhala script, **Then** the assistant responds in Sinhala with correctly rendered Unicode text and relevant product cards.
4. **Given** a Tanglish query ("mudalata gift ekak"), **When** submitted, **Then** the assistant interprets the mixed Tamil-English-Sinhala intent and returns appropriate results.
5. **Given** no products match a query, **When** the search returns empty, **Then** the assistant suggests alternative categories or related products rather than showing an empty state.

---

### User Story 2 - Add to Cart and Manage Cart (Priority: P2)

The user selects a product from the conversation and adds it to a persistent in-session cart.
They can view, modify, and remove items through conversational commands or an interactive cart
widget visible alongside the chat.

**Why this priority**: Converting discovery into intent-to-buy is the second critical step. A
shopper who cannot manage a cart cannot complete a purchase.

**Independent Test**: Add two products via conversation ("add the first one" / "add it"), then
say "remove the cake", and confirm the cart updates correctly with a visible item count and
running total.

**Acceptance Scenarios**:

1. **Given** a product card is displayed, **When** the user taps "Add to Cart" or says "add it", **Then** the cart count increments and a confirmation message appears in the conversation.
2. **Given** items are in the cart, **When** the user asks "what's in my cart?", **Then** the assistant lists all cart items with quantities and prices.
3. **Given** a multi-item cart, **When** the user says "remove the flowers", **Then** the named item is removed and the total updates.
4. **Given** the cart has items, **When** the user changes quantity via conversation ("make it 2"), **Then** the quantity and subtotal update immediately.

---

### User Story 3 - Delivery Check and Checkout (Priority: P3)

The user enters their delivery city, the assistant checks availability and delivery cost via
the Kapruka MCP, then guides the user through guest checkout. On success, the user receives a
payment URL and order confirmation within the conversation.

**Why this priority**: Completing a purchase end-to-end is the primary business outcome of the
challenge. Delivery and checkout must work before advanced features are added.

**Independent Test**: With items in the cart, say "deliver to Kandy". The assistant must confirm
delivery availability and cost, then walk through the checkout fields, submit the order, and
display a payment link — all without leaving the chat interface.

**Acceptance Scenarios**:

1. **Given** items in the cart, **When** the user provides a delivery city, **Then** the assistant checks delivery availability and displays the delivery fee and estimated date.
2. **Given** delivery is confirmed, **When** the user proceeds to checkout, **Then** the assistant collects only the required guest fields (name, phone, address) conversationally, one at a time.
3. **Given** all checkout fields are collected, **When** the order is submitted, **Then** a payment URL is displayed in the conversation and an order ID is shown.
4. **Given** delivery is not available to the specified city, **When** the user asks, **Then** the assistant offers alternative nearby cities or a store-pickup option if available.

---

### User Story 4 - Gift Recommendation Assistant (Priority: P4)

A gift shopper describes the recipient (age, gender, occasion, budget) and the assistant
proactively recommends curated gift options and explains why each is appropriate.

**[CHANGED]**: Bundle grouping (grouping multiple recommended items into a single combined-price
unit) is **NOT IMPLEMENTED**. The gift advisor behavior itself lives entirely in the system prompt
(`src/lib/ai/system-prompt.ts`) as reasoning guidance — there is no dedicated gift-profile UI
component or bundle data structure in code today.

**Why this priority**: Gift shoppers are a primary user segment for Kapruka. A gift advisor
differentiates the assistant from a plain search box and is a key challenge differentiator.

**Independent Test**: Type "I need a gift for my mother's 60th birthday, budget around 5000
rupees." The assistant must ask at most one clarifying question and then present at least three
distinct, reasoned gift recommendations with product cards.

**Acceptance Scenarios**:

1. **Given** a gift description, **When** submitted, **Then** the assistant presents at least 3 curated options with a one-line rationale for each.
2. **Given** a budget constraint is stated, **When** results are shown, **Then** all recommended products are within ±10% of the stated budget.
3. **[NOT IMPLEMENTED]** **Given** multiple gift items are recommended, **When** the user asks "make a bundle", **Then** the assistant groups compatible items and shows a combined price. No bundle grouping or combined-price card exists in the current UI/JSON-card protocol.

---

### User Story 5 - Order Tracking (Priority: P5)

A user who has previously placed an order can ask the assistant to track it by providing their
order ID, and the assistant returns the current status and estimated delivery date.

**Why this priority**: Post-purchase support reduces support overhead and builds trust. It is a
self-contained flow that can be delivered independently.

**Independent Test**: Say "track my order" and provide an order ID when prompted. The assistant
must return the order status and next expected event.

**Acceptance Scenarios**:

1. **Given** the user asks to track an order, **When** they provide a valid order ID, **Then** the assistant displays current status, last update, and estimated delivery.
2. **Given** an invalid order ID, **When** submitted, **Then** the assistant explains the ID was not found and offers to help with a new search.

---

### Edge Cases

- What happens when the Kapruka MCP is unreachable mid-conversation? The assistant must display a friendly error and retain the conversation state so the user can retry.
- What happens when a product goes out of stock between discovery and checkout? The assistant must notify the user and suggest alternatives before allowing checkout to proceed.
- What happens when a Sinhala query contains mixed Unicode normalisation forms? The assistant must normalise input before processing to avoid mismatches.
- What happens when the user switches languages mid-conversation (starts in English, continues in Sinhala)? The assistant must detect the switch and respond in the new language.
- What happens when voice input cannot be transcribed confidently? The assistant must display what it heard, ask for confirmation, and allow the user to correct it by typing.
- What happens when cart session expires or the page is refreshed? The cart state must be recoverable within the same browser session.

## Requirements _(mandatory)_

### Functional Requirements

**Product Discovery**

- **FR-001**: The assistant MUST accept product queries in English, Sinhala (Unicode), and Tanglish and return relevant product results.
- **FR-002**: The assistant MUST display product results as rich cards containing at minimum: product image, name, price in LKR, and an Add-to-Cart action.
- **FR-003**: The assistant MUST support follow-up refinements (price filter, category filter, stock filter) within the same conversation thread without resetting context.
- **FR-004**: The system MUST provide category browsing when the user asks to explore categories rather than search by keyword.
- **FR-005**: The assistant MUST surface product recommendations proactively when user intent suggests it (e.g., "birthday gift" triggers gift recommendation flow).

**Cart Management**

- **FR-006**: Users MUST be able to add, remove, and update quantities of products via conversational commands and via direct widget interaction.
- **FR-007**: The cart MUST persist for the duration of the browser session without requiring account creation. Cart state MUST be re-hydrated synchronously from `sessionStorage` before first paint so the item count in the header is always correct on page load with no visible empty-cart flash.
- **FR-008**: The cart widget MUST display a live item count and running total at all times.

**Delivery & Checkout**

- **FR-009**: The assistant MUST verify delivery availability and cost for a user-specified city before proceeding to checkout.
- **FR-010**: The assistant MUST collect only the minimum required guest checkout fields (full name, phone number, delivery address) and validate each before submission.
- **FR-011**: On successful order creation, the assistant MUST display the payment URL and order ID within the conversation.
- **FR-012**: The assistant MUST handle delivery unavailability gracefully by suggesting alternatives.

**Language & Accessibility**

- **FR-013 [CHANGED]**: Assistant *responses* (chat text) are available in English, Sinhala, and Tanglish, driven entirely by the LLM via `system-prompt.ts` instructions — there is no UI-string i18n framework in use. Static UI labels (buttons, page chrome) are English-only. `src/lib/i18n/` (`next-intl`-shaped message JSON for en/si/ta-Latn) exists in the repo but `next-intl` is not installed and these files are not imported anywhere — dead code, not wired up.
- **FR-014**: The active language MUST be detected from the user's most recent message (`detectLocale()` in `src/lib/utils/unicode.ts`) and used for all subsequent assistant responses in that turn. Implemented as specified.
- **FR-015 [NOT VERIFIED]**: No automated accessibility testing exists (no test files anywhere in the repo, despite Vitest/Playwright being installed as dependencies). WCAG 2.1 AA is a design intent, not a verified/enforced gate.

**Voice**

- **FR-016**: Users can initiate voice input via the browser Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`), implemented in `CommandBar.tsx`. Transcribed text is submitted as a normal chat message. Implemented as specified.
- **FR-017 [NOT IMPLEMENTED]**: Voice output (text-to-speech) does not exist anywhere in the codebase. No TTS library, no `SpeechSynthesis` usage.

**Advanced**

- **FR-018**: The Gift Recommendation flow accepts recipient description (age, occasion, budget) and returns curated, reasoned product suggestions. Implemented as specified — driven by system-prompt reasoning, not a dedicated data structure (no `GiftProfile` type is actually constructed/passed anywhere in code; see Key Entities note below).
- **FR-019 [NOT IMPLEMENTED]**: Multi-item bundle creation (grouping selected products into a combined-price unit) does not exist. The JSON-card protocol (`products` / `order` / `orderStatus` / `cartAction`) has no bundle card type.
- **FR-020**: Users can track an existing order by providing an order number within the conversation (`track_order` tool), and also via a dedicated non-chat surface: the Orders panel (`OrdersPanel.tsx`) with polling (`useOrderPolling.ts`) against `POST /api/orders/track`. This second path is an addition beyond the original spec.
- **FR-021**: The assistant is aware of delivery date windows via `check_delivery` and surfaces estimated delivery dates during discovery and at checkout. Implemented as specified.
- **FR-022**: Conversation context is maintained across all turns within a session. Implemented as specified.

**Reliability**

- **FR-023**: All Kapruka MCP tool calls are retried up to 2 times (`src/lib/mcp/client.ts`) on transient failure before surfacing an error to the user. Implemented as specified.
- **FR-024 [PARTIAL]**: Tool call errors and chat-level failures are logged via structured `console.error` calls (e.g. `chat_error`, `track_order_error` events). There is no external observability/logging service integration — logs go to the Vercel Functions log output only.
- **FR-025**: AI responses stream to the UI progressively via a custom Server-Sent-Events protocol (`createSSEStream` in `src/lib/ai/streaming.ts` + hand-parsed on the client in `useChat.ts`) — not the Vercel AI SDK's built-in `useChat`/`StreamingTextResponse` helpers as earlier docs implied. Implemented, differently than originally planned.
- **FR-026 [CHANGED]**: This requirement is provider-agnostic in practice, not Gemini-specific — the app supports three AI providers (Google Gemini, Anthropic Claude, OpenAI) selected via `AI_PROVIDER`. When the active provider's API is unavailable or errors, the assistant emits an inline `error` SSE event; the client renders it in the conversation thread with a retry action, preserving conversation history and cart state. No full-page error or reload occurs. Implemented as specified, generalized beyond Gemini.

### Key Entities

- **Conversation**: A single session's thread of user messages and assistant responses, with associated tool call history and active locale. See `ConversationState`/`ConversationMessage` in `src/types/domain.ts`.
- **Product**: An item retrieved from Kapruka MCP with id, name, images, price, category, stock status, and delivery eligibility. See `ProductSummary`/`Product` in `src/types/domain.ts` (aliases of MCP-derived `ProductSearchResult`/`GetProductOutput`).
- **CartItem** / **Cart**: The in-session collection of products with subtotal and item count. Matches `src/types/domain.ts` exactly.
- **DeliveryOption**: A city, delivery availability flag, fee in LKR, and estimated delivery window. Matches `src/types/domain.ts` exactly.
- **Order**: A completed guest checkout with order ref, payment URL, pricing summary, and expiry. Matches `src/types/domain.ts` exactly.
- **OrderStatus** *(not listed in the original spec, but a first-class type in code)*: Result of `track_order` — status, progress steps, recipient, tracking flags. See `OrderStatus` in `src/types/domain.ts`.
- **GiftProfile [ASPIRATIONAL]**: A `GiftProfile` TypeScript interface exists in `src/types/domain.ts` (occasion, recipient_age, recipient_gender, budget_min/max, notes), but it is never constructed or passed anywhere in the actual code — the gift-advisor behavior is driven purely by system-prompt reasoning over the normal `search_products` tool, not by building a `GiftProfile` object.

**Not in the original spec, but implemented and real** — these client-only features exist in code with no corresponding spec coverage:

- **Chat history**: Last 5 sessions auto-saved to `localStorage` (`src/features/history/`), viewable/restorable via `HistoryPanel`.
- **Theme**: Light/dark mode toggle with a pre-paint inline script to avoid flash-of-wrong-theme (`src/features/theme/store.ts`, `src/app/layout.tsx`).
- **Product image backfill**: Since Kapruka MCP never returns `image_url` for search results, `src/app/api/product-image/route.ts` scrapes the `og:image` meta tag from the live kapruka.com product page as a fallback (cached 1h, in-flight deduped).

## Success Criteria _(mandatory)_

### Measurable Outcomes

> None of SC-001 through SC-008 are backed by an automated test or CI gate (no test files exist
> in the repo). These remain the target bar, unverified rather than disproven.

- **SC-001**: A user can complete the full journey — discovery → cart → delivery check → checkout → payment link — in a single conversation without leaving the chat interface.
- **SC-002 [UNVERIFIED]**: The assistant responds to any product query with visual results in under 3 seconds on a standard 4G mobile connection.
- **SC-003**: Queries in English, Sinhala, and Tanglish each return relevant results with no manual language selection required.
- **SC-004 [UNVERIFIED]**: 90% of first-time users can add a product to the cart and reach the checkout prompt without external help or documentation.
- **SC-005 [UNVERIFIED]**: All interactive elements are operable via keyboard and screen reader with no accessibility errors reported by an automated audit tool.
- **SC-006 [UNVERIFIED]**: The assistant's first response token appears within 1 second of a user message being submitted (streaming latency).
- **SC-007 [UNVERIFIED]**: The checkout flow collects all required fields and submits a valid order with a success rate of 95% when valid inputs are provided.
- **SC-008 [UNVERIFIED]**: The UI is fully functional and visually correct at 375 px (mobile), 768 px (tablet), and 1280 px (desktop) viewport widths.

## Assumptions

- Users have an active internet connection; offline mode is out of scope for v1.
- Guest checkout is the only checkout path; account-based login is out of scope for v1.
- Payment processing is handled by Kapruka's payment gateway via the URL returned by `kapruka_create_order`; the assistant does not handle payment directly.
- The Kapruka MCP endpoint (`https://mcp.kapruka.com/mcp`) is publicly accessible with no authentication required, as specified.
- Product images are served by Kapruka's CDN at stable URLs returned by the MCP tools.
- Voice input is browser-native (Web Speech API); voice output/TTS was assumed in scope originally but was never built (see FR-017). A native mobile app is out of scope.
- Conversation memory is session-scoped (browser tab); cross-session memory persistence is out of scope for v1.
- Tanglish is defined as Tamil expressed in Latin (English) script mixed with Sinhala words; the AI model is expected to interpret this without a separate translation service.
- Delivery date awareness relies on the dates returned by `kapruka_check_delivery`; no independent date calculation logic is required.
- The agent personality (friendly, professional, shopping concierge) is enforced via the AI system prompt; no separate personality configuration UI is required.
- Guest checkout data (recipient name, phone, delivery address) is sent directly to the Kapruka MCP and is NOT retained server-side by this application. No PII is logged or stored beyond the current request lifecycle.

## Clarifications

### Session 2026-06-05

- Q: What should the assistant display when Gemini AI is unavailable? → A: Inline error message in chat with retry action; conversation history preserved (Option A).
- Q: Is any guest checkout data retained server-side after the order is placed? → A: No — checkout data sent to Kapruka MCP only; this app stores nothing server-side (Option A).
- Q: How should the cart load from sessionStorage on page refresh? → A: Synchronous re-hydration before first paint — no empty-cart flash (Option A).
