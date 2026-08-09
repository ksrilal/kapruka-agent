# Data Model: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`
**Last reconciled with codebase**: 2026-07-27

All types below map directly to `src/types/domain.ts` and `src/types/mcp.ts`. Zod schemas
are generated for every type that crosses an API boundary. This document was checked line-by-line
against the current source — it was already the most accurate of the spec-kit docs; the one
factual error found (`OrderStatus.amount`) is corrected below, and a note on `GiftProfile` is
added since that type is defined but never actually constructed anywhere in the code.

---

## Core Domain Types

### Product

Returned by `kapruka_search_products` (list form) and `kapruka_get_product` (full form).

```typescript
interface ProductPrice {
  amount: number; // float, in requested currency
  currency: string; // "LKR" | "USD" | "GBP" | "AUD" | "CAD" | "EUR"
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  path?: string; // full breadcrumb path (detail only)
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: ProductPrice;
  in_stock: boolean;
  stock_level: StockLevel;
  attributes: Record<string, string>;
}

interface ProductShipping {
  ships_from: string;
  ships_internationally: boolean;
  restricted_countries: string[];
}

type StockLevel = "low" | "medium" | "high";

// Search result (partial)
interface ProductSummary {
  id: string;
  name: string;
  summary: string;
  price: ProductPrice;
  compare_at_price?: ProductPrice;
  in_stock: boolean;
  stock_level: StockLevel;
  image_url: string | null;
  category: ProductCategory;
  ships_internationally: boolean;
  url: string;
}

// Full detail
interface Product extends ProductSummary {
  description: string;
  images: string[];
  variants: ProductVariant[];
  attributes: {
    type?: string;
    subtype?: string;
    weight?: string;
    vendor?: string;
  };
  shipping: ProductShipping;
  rating: null; // Kapruka MCP always returns null currently
}
```

**Validation rules**:

- `price.amount` must be ≥ 0
- `id` must be 3–80 characters
- `image_url` may be null (show placeholder image)
- Products with price = 0 and `CATSYM`-prefixed IDs are category stubs — filter from UI

---

### CartItem and Cart

In-session state. Never sent to Kapruka until `kapruka_create_order` is called.

```typescript
interface CartItem {
  product: ProductSummary; // snapshot at time of add
  quantity: number; // 1–99
  icing_text?: string; // max 120 chars; cakes only
}

interface Cart {
  items: CartItem[];
  subtotal: number; // sum of (price.amount × quantity), LKR
  item_count: number; // sum of quantities
}
```

**Validation rules**:

- `quantity` must be 1–99 (MCP constraint)
- Total items in cart must not exceed 30 (MCP constraint)
- `icing_text` is only valid when product category is cake/baked goods

**State transitions**:

```
Empty → [add item] → Has Items → [remove all] → Empty
Has Items → [add item] → Has Items
Has Items → [update qty] → Has Items
Has Items → [checkout] → Checkout In Progress → [order confirmed] → Empty
```

---

### DeliveryOption

Result of `kapruka_check_delivery`.

```typescript
interface DeliveryOption {
  city: string;
  checked_date: string; // YYYY-MM-DD
  available: boolean;
  rate: number; // LKR flat fee
  currency: "LKR";
  reason: string | null; // why unavailable (if !available)
  next_available_date: string | null; // YYYY-MM-DD
  perishable_warning: string | null; // for cakes/flowers
}
```

---

### Order

Result of `kapruka_create_order`. Displayed in `OrderConfirmation` component.

```typescript
interface OrderSummaryPricing {
  items_total: number;
  delivery_fee: number;
  addons_total: number;
  grand_total: number;
  currency: string;
}

interface Order {
  checkout_url: string; // click-to-pay URL; valid 60 min
  order_ref: string; // e.g. "ORD-20260520-7823"
  summary: OrderSummaryPricing;
  expires_at: string; // ISO 8601
}
```

**Validation rules**:

- `checkout_url` must be a valid HTTPS URL
- UI must display expiry countdown based on `expires_at`

---

### OrderStatus

Result of `kapruka_track_order`. Note: uses `order_number` from confirmation email,
NOT `order_ref` from `kapruka_create_order`.

```typescript
type OrderStatusValue =
  | "received"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | string; // open-ended for future statuses

interface OrderProgressStep {
  step: string;
  timestamp: string;
}

interface OrderTrackingItem {
  product_id: string;
  name: string;
  quantity: number;
  selling_price: number;
}

interface OrderStatus {
  order_number: string;
  pnref: string;
  status: OrderStatusValue;
  status_display: string;
  order_date: string;
  delivery_date: string;
  shipped_date: string | null;
  amount: { value: string; currency: string }; // object, not a bare string — corrected 2026-07-27
  payment_method: string;
  comments: string | null;
  recipient: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  greeting_message: string | null;
  special_instructions: string | null;
  progress: OrderProgressStep[];
  live_tracking_available: boolean;
  has_delivery_video: boolean;
  has_delivery_photo: boolean;
  items: OrderTrackingItem[];
}
```

---

### GiftProfile **[type exists, unused in practice]**

Defined in `src/types/domain.ts` as a description of what the gift recommendation flow
conceptually operates on, but **no code anywhere actually constructs a `GiftProfile` object** —
the gift-advisor behavior is driven entirely by the LLM reasoning over free-form conversation via
`system-prompt.ts`, then calling the normal `search_products` tool. Treat this type as documenting
intent/shape, not a runtime data flow.

```typescript
interface GiftProfile {
  occasion: string; // e.g. "birthday", "anniversary", "graduation"
  recipient_age?: number; // approximate
  recipient_gender?: "male" | "female" | "neutral";
  budget_min?: number; // LKR
  budget_max?: number; // LKR
  notes?: string; // free-form additional context
}
```

---

### Conversation **[CHANGED — actual shape is richer]**

Session-scoped conversation state managed by a Zustand store (`src/features/chat/store.ts`), not
the Vercel AI SDK's built-in chat state as originally documented. The actual
`ConversationMessage` (`src/types/domain.ts`) carries additional fields for rendering the
JSON-card protocol and error UI directly on the message, which this document's original version
omitted:

```typescript
type MessageRole = "user" | "assistant" | "tool";
type Locale = "en" | "si" | "ta-Latn";

interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  locale?: Locale;
  products?: ProductSummary[];     // populated when this turn emitted a "products" card
  order?: Order;                   // populated when this turn emitted an "order" card
  orderStatus?: OrderStatus;       // populated when this turn emitted an "orderStatus" card
  isError?: boolean;               // true if this bubble renders as an inline error
  retryable?: boolean;             // whether a retry action should be shown
  errorMessage?: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  toolSteps?: ToolStep[];          // running/done status per tool call, for the ThinkingIndicator
  timestamp: number;
}

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface ToolResult {
  tool_call_id: string;
  content: unknown;
}

interface ToolStep {
  tool: string;
  status: "running" | "done";
}

interface ConversationState {
  messages: ConversationMessage[];
  locale: Locale;
  is_streaming: boolean;
}
```

---

### Category

Result of `kapruka_list_categories`.

```typescript
interface Category {
  name: string;
  url: string;
  children: Category[]; // depth ≤ 2
}
```

---

### DeliveryCity

Result of `kapruka_list_delivery_cities`.

```typescript
interface DeliveryCity {
  name: string; // canonical name for use in kapruka_check_delivery
  aliases: string[]; // vernacular/alternate names
}
```

---

## MCP Tool I/O Types (src/types/mcp.ts)

Complete input/output interfaces for all 7 Kapruka MCP tools, derived from live schema
discovery. See [contracts/mcp-types.ts](./contracts/mcp-types.ts) for the full TypeScript
source.

---

## Entity Relationship Summary

```text
ConversationState
  └── messages[]
        └── ToolCall / ToolResult

Cart
  └── CartItem[]
        └── ProductSummary (snapshot)

GiftProfile ──→ kapruka_search_products (params) ──→ ProductSummary[]

ProductSummary ──→ kapruka_get_product ──→ Product (full detail)

DeliveryCity ──→ kapruka_check_delivery ──→ DeliveryOption

Cart + CheckoutFields ──→ kapruka_create_order ──→ Order

order_number (email) ──→ kapruka_track_order ──→ OrderStatus
```
