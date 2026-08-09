import type { ProductSearchResult, GetProductOutput } from "./mcp";

export type Locale = "en" | "si" | "ta-Latn";

// ─── Product ──────────────────────────────────────────────────────────────────

export type ProductSummary = ProductSearchResult;
export type Product = GetProductOutput;

// Adapter helpers — bridge MCP field names to UI-friendly names
export function productId(p: ProductSummary): string {
  return p.id;
}
export function productPrice(p: ProductSummary): number {
  return p.price?.amount ?? 0;
}
export function productOriginalPrice(p: ProductSummary): number | undefined {
  const v = p.compare_at_price?.amount;
  return v && v > (p.price?.amount ?? 0) ? v : undefined;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: ProductSummary;
  quantity: number;
  icing_text?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export interface DeliveryOption {
  city: string;
  checked_date: string;
  available: boolean;
  rate: number;
  currency: "LKR";
  reason: string | null;
  next_available_date: string | null;
  perishable_warning: string | null;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderPricing {
  items_total: number;
  delivery_fee: number;
  addons_total: number;
  grand_total: number;
  currency: string;
}

export interface Order {
  checkout_url: string;
  order_ref: string;
  summary: OrderPricing;
  expires_at: string;
}

export interface OrderTrackingRecipient {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface OrderProgressStep {
  step: string;
  timestamp: string;
}

export interface OrderTrackingItem {
  product_id: string;
  name: string;
  quantity: number;
  selling_price: number;
}

export interface OrderStatus {
  order_number: string;
  pnref: string;
  status: string;
  status_display: string;
  order_date: string;
  delivery_date: string;
  shipped_date: string | null;
  amount: { value: string; currency: string };
  payment_method: string;
  comments: string | null;
  recipient: OrderTrackingRecipient;
  greeting_message: string | null;
  special_instructions: string | null;
  progress: OrderProgressStep[];
  live_tracking_available: boolean;
  has_delivery_video: boolean;
  has_delivery_photo: boolean;
  items: OrderTrackingItem[];
}

// ─── Customer account (private-preview MCP tools) ────────────────────────────

export interface CustomerProfile {
  name: string;
  email: string;
  phone?: string;
  language?: string;
  billing?: Record<string, unknown>;
}

export interface CustomerOrderSummary {
  order_ref: string;
  status: string;
  order_date?: string;
  delivery_date?: string;
  amount?: { value: string; currency: string };
  recipient?: { name: string };
  items?: Array<{ name: string; quantity?: number; product_id?: string }>;
}

export interface CustomerAddress {
  recipient_name: string;
  address: string;
  city: string;
  phone?: string;
  label?: string;
}

export interface CustomerAccount {
  email: string;
  profile: CustomerProfile;
  orders: CustomerOrderSummary[];
  addresses: CustomerAddress[];
  fetchedAt: number;
}

// ─── Gift ─────────────────────────────────────────────────────────────────────

export interface GiftProfile {
  occasion: string;
  recipient_age?: number;
  recipient_gender?: "male" | "female" | "neutral";
  budget_min?: number;
  budget_max?: number;
  notes?: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  content: unknown;
}

export interface ToolStep {
  tool: string;
  status: "running" | "done";
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  locale?: Locale;
  products?: ProductSummary[];
  order?: Order;
  orderStatus?: OrderStatus;
  giftProfile?: GiftProfile;
  isError?: boolean;
  retryable?: boolean;
  errorMessage?: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  toolSteps?: ToolStep[];
  timestamp: number;
}

export interface ConversationState {
  messages: ConversationMessage[];
  locale: Locale;
  is_streaming: boolean;
}
