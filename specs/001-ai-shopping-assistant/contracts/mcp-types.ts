/**
 * Kapruka MCP v1.27.0 — typed tool input/output contracts
 * Source: live schema discovery from https://mcp.kapruka.com/mcp
 * Generated: 2026-06-05
 *
 * All types enforced at runtime via Zod schemas in lib/mcp/tools/*.ts
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export type Currency = "LKR" | "USD" | "GBP" | "AUD" | "CAD" | "EUR";
export type ResponseFormat = "markdown" | "json";
export type StockLevel = "low" | "medium" | "high";
export type SortOrder = "relevance" | "price_asc" | "price_desc" | "newest" | "bestseller";
export type LocationType = "house" | "apartment" | "office" | "other";

export interface Price {
  amount: number | null;
  currency: Currency;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  path?: string;
}

// ─── kapruka_list_categories ──────────────────────────────────────────────────

export interface ListCategoriesInput {
  depth?: 1 | 2;
  response_format?: ResponseFormat;
}

export interface CategoryNode {
  name: string;
  url: string;
  children: CategoryNode[];
}

export interface ListCategoriesOutput {
  categories: CategoryNode[];
}

// ─── kapruka_search_products ──────────────────────────────────────────────────

export interface SearchProductsInput {
  q: string;                    // 3–200 chars, required
  category?: string | null;
  limit?: number;               // 1–50, default 10
  cursor?: string | null;
  currency?: Currency;
  min_price?: number | null;    // ≥ 0
  max_price?: number | null;    // ≥ 0
  in_stock_only?: boolean;
  sort?: SortOrder;
  include_stubs?: boolean;
  response_format?: ResponseFormat;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  summary: string;
  price: Price;
  compare_at_price: Price;
  in_stock: boolean;
  stock_level: StockLevel;
  image_url: string | null;
  category: Category;
  rating: null;
  ships_internationally: boolean;
  url: string;
}

export interface SearchProductsOutput {
  results: ProductSearchResult[];
  next_cursor: string | null;
  applied_filters: {
    q: string;
    limit: number;
    in_stock_only: boolean;
  };
}

// ─── kapruka_get_product ──────────────────────────────────────────────────────

export interface GetProductInput {
  product_id: string;           // 3–80 chars, required
  currency?: Currency;
  type?: string | null;
  response_format?: ResponseFormat;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: Price;
  in_stock: boolean;
  stock_level: StockLevel;
  attributes: Record<string, string>;
}

export interface GetProductOutput {
  id: string;
  name: string;
  description: string;
  summary: string;
  price: Price;
  compare_at_price: Price;
  in_stock: boolean;
  stock_level: StockLevel;
  category: Category;
  variants: ProductVariant[];
  images: string[];
  attributes: {
    type?: string;
    subtype?: string;
    weight?: string;
    vendor?: string;
  };
  shipping: {
    ships_from: string;
    ships_internationally: boolean;
    restricted_countries: string[];
  };
  rating: null;
  url: string;
}

// ─── kapruka_list_delivery_cities ────────────────────────────────────────────

export interface ListDeliveryCitiesInput {
  query?: string | null;        // ≤ 50 chars
  limit?: number;               // 1–50, default 25
  response_format?: ResponseFormat;
}

export interface DeliveryCity {
  name: string;
  aliases: string[];
}

export interface ListDeliveryCitiesOutput {
  cities: DeliveryCity[];
  total_matched: number;
  showing: number;
}

// ─── kapruka_check_delivery ───────────────────────────────────────────────────

export interface CheckDeliveryInput {
  city: string;                 // 2–100 chars, required
  delivery_date?: string | null; // YYYY-MM-DD; defaults to today LK time
  product_id?: string | null;
  response_format?: ResponseFormat;
}

export interface CheckDeliveryOutput {
  city: string;
  now: string;                  // ISO datetime, LK time
  checked_date: string;         // YYYY-MM-DD
  available: boolean;
  rate: number;                 // LKR flat fee
  currency: "LKR";
  reason: string | null;
  next_available_date: string | null;
  perishable_warning: string | null;
}

// ─── kapruka_create_order ────────────────────────────────────────────────────

export interface OrderCartItem {
  product_id: string;           // 3–80 chars, required
  quantity?: number;            // 1–99, default 1
  icing_text?: string | null;   // ≤ 120 chars; cakes only
}

export interface OrderRecipient {
  name: string;                 // 1–80 chars, required
  phone: string;                // 7–30 chars, E.164 or SL local, required
}

export interface OrderDelivery {
  address: string;              // 3–250 chars, required
  city: string;                 // 2–100 chars, required
  date: string;                 // YYYY-MM-DD, required; today or future (Asia/Colombo)
  location_type?: LocationType; // default "house"
  instructions?: string | null; // ≤ 250 chars
}

export interface OrderSender {
  name: string;                 // 1–80 chars, required
  anonymous?: boolean;          // default false
}

export interface CreateOrderInput {
  cart: OrderCartItem[];        // 1–30 items, required
  recipient: OrderRecipient;    // required
  delivery: OrderDelivery;      // required
  sender: OrderSender;          // required
  gift_message?: string | null; // ≤ 300 chars
  currency?: Currency;
  response_format?: ResponseFormat;
}

export type CreateOrderErrorCode =
  | "empty_cart"
  | "missing_field"
  | "past_delivery_date"
  | "product_not_found"
  | "product_out_of_stock"
  | "city_not_deliverable"
  | "date_not_deliverable";

export interface CreateOrderOutput {
  checkout_url: string;
  order_ref: string;            // e.g. "ORD-20260520-7823"
  summary: {
    items_total: number;
    delivery_fee: number;
    addons_total: number;
    grand_total: number;
    currency: string;
  };
  expires_at: string;           // ISO 8601; URL valid for 60 min
}

// ─── kapruka_track_order ──────────────────────────────────────────────────────

export interface TrackOrderInput {
  order_number: string;         // 4–40 chars; from confirmation email, NOT order_ref
  response_format?: ResponseFormat;
}

export type OrderStatusValue =
  | "received" | "confirmed" | "shipped" | "delivered" | "cancelled"
  | (string & Record<never, never>); // extensible

export interface OrderProgressStep {
  step: string;
  timestamp: string;
}

export interface TrackOrderOutput {
  order_number: string;
  pnref: string;
  status: OrderStatusValue;
  status_display: string;
  order_date: string;
  delivery_date: string;
  shipped_date: string | null;
  amount: string;               // formatted LKR string
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
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    selling_price: number;
  }>;
}

// ─── MCP Tool union (for Gemini function declaration mapping) ────────────────

export type KaprukaTool =
  | "kapruka_list_categories"
  | "kapruka_search_products"
  | "kapruka_get_product"
  | "kapruka_list_delivery_cities"
  | "kapruka_check_delivery"
  | "kapruka_create_order"
  | "kapruka_track_order";
