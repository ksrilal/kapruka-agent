/**
 * Kapruka MCP v1.27.0 — typed tool input/output contracts
 * Source: live schema discovery from https://mcp.kapruka.com/mcp
 */

import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export type Currency = "LKR" | "USD" | "GBP" | "AUD" | "CAD" | "EUR";
export type ResponseFormat = "markdown" | "json";
export type StockLevel = "low" | "medium" | "high";
export type SortOrder =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "bestseller";
export type LocationType = "house" | "apartment" | "office" | "other";

export const PriceSchema = z.object({
  amount: z.number().nullable(),
  currency: z.string(),
});
export type Price = z.infer<typeof PriceSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  path: z.string().optional(),
});
export type McpCategory = z.infer<typeof CategorySchema>;

// ─── kapruka_list_categories ──────────────────────────────────────────────────

export interface ListCategoriesInput {
  depth?: 1 | 2;
  response_format?: ResponseFormat;
}

export type CategoryNode = {
  name: string;
  url: string;
  children: CategoryNode[];
};

export const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    url: z.string(),
    children: z.array(CategoryNodeSchema),
  })
);

export const ListCategoriesOutputSchema = z.object({
  categories: z.array(CategoryNodeSchema),
});
export type ListCategoriesOutput = z.infer<typeof ListCategoriesOutputSchema>;

// ─── kapruka_search_products ──────────────────────────────────────────────────

export interface SearchProductsInput {
  q: string;
  category?: string | null;
  limit?: number;
  cursor?: string | null;
  currency?: Currency;
  min_price?: number | null;
  max_price?: number | null;
  in_stock_only?: boolean;
  sort?: SortOrder;
  include_stubs?: boolean;
  response_format?: ResponseFormat;
}

export const ProductSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  price: PriceSchema,
  compare_at_price: PriceSchema,
  in_stock: z.boolean(),
  stock_level: z.enum(["low", "medium", "high"]),
  image_url: z.string().nullable(),
  category: CategorySchema,
  rating: z.null(),
  ships_internationally: z.boolean(),
  url: z.string(),
});
export type ProductSearchResult = z.infer<typeof ProductSearchResultSchema>;

export const SearchProductsOutputSchema = z.object({
  results: z.array(ProductSearchResultSchema),
  next_cursor: z.string().nullable(),
  applied_filters: z.object({
    q: z.string(),
    limit: z.number(),
    in_stock_only: z.boolean(),
  }),
});
export type SearchProductsOutput = z.infer<typeof SearchProductsOutputSchema>;

// ─── kapruka_get_product ──────────────────────────────────────────────────────

export interface GetProductInput {
  product_id: string;
  currency?: Currency;
  type?: string | null;
  response_format?: ResponseFormat;
}

export const ProductVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  price: PriceSchema,
  in_stock: z.boolean(),
  stock_level: z.enum(["low", "medium", "high"]),
  attributes: z.record(z.string(), z.string()),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const GetProductOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  summary: z.string(),
  price: PriceSchema,
  compare_at_price: PriceSchema,
  in_stock: z.boolean(),
  stock_level: z.enum(["low", "medium", "high"]),
  category: CategorySchema,
  variants: z.array(ProductVariantSchema),
  images: z.array(z.string()),
  attributes: z.object({
    type: z.string().optional(),
    subtype: z.string().optional(),
    weight: z.string().optional(),
    vendor: z.string().optional(),
  }),
  shipping: z.object({
    ships_from: z.string(),
    ships_internationally: z.boolean(),
    restricted_countries: z.array(z.string()),
  }),
  rating: z.null(),
  url: z.string(),
});
export type GetProductOutput = z.infer<typeof GetProductOutputSchema>;

// ─── kapruka_list_delivery_cities ────────────────────────────────────────────

export interface ListDeliveryCitiesInput {
  query?: string | null;
  limit?: number;
  response_format?: ResponseFormat;
}

export const DeliveryCitySchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
});
export type DeliveryCity = z.infer<typeof DeliveryCitySchema>;

export const ListDeliveryCitiesOutputSchema = z.object({
  cities: z.array(DeliveryCitySchema),
  total_matched: z.number(),
  showing: z.number(),
});
export type ListDeliveryCitiesOutput = z.infer<
  typeof ListDeliveryCitiesOutputSchema
>;

// ─── kapruka_check_delivery ───────────────────────────────────────────────────

export interface CheckDeliveryInput {
  city: string;
  delivery_date?: string | null;
  product_id?: string | null;
  response_format?: ResponseFormat;
}

export const CheckDeliveryOutputSchema = z.object({
  city: z.string(),
  now: z.string(),
  checked_date: z.string(),
  available: z.boolean(),
  rate: z.number(),
  currency: z.literal("LKR"),
  reason: z.string().nullable(),
  next_available_date: z.string().nullable(),
  perishable_warning: z.string().nullable(),
});
export type CheckDeliveryOutput = z.infer<typeof CheckDeliveryOutputSchema>;

// ─── kapruka_create_order ────────────────────────────────────────────────────

export interface OrderCartItem {
  product_id: string;
  quantity?: number;
  icing_text?: string | null;
}

export interface OrderRecipient {
  name: string;
  phone: string;
}

export interface OrderDelivery {
  address: string;
  city: string;
  date: string;
  location_type?: LocationType;
  instructions?: string | null;
}

export interface OrderSender {
  name: string;
  anonymous?: boolean;
}

export interface CreateOrderInput {
  cart: OrderCartItem[];
  recipient: OrderRecipient;
  delivery: OrderDelivery;
  sender: OrderSender;
  gift_message?: string | null;
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

export const CreateOrderOutputSchema = z.object({
  checkout_url: z.string().url(),
  order_ref: z.string(),
  summary: z.object({
    items_total: z.number(),
    delivery_fee: z.number(),
    addons_total: z.number(),
    grand_total: z.number(),
    currency: z.string(),
  }),
  expires_at: z.string(),
});
export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;

// ─── kapruka_track_order ──────────────────────────────────────────────────────

export interface TrackOrderInput {
  order_number: string;
  response_format?: ResponseFormat;
}

export const OrderProgressStepSchema = z.object({
  step: z.string(),
  timestamp: z.string(),
});

export const TrackOrderOutputSchema = z.object({
  order_number: z.string(),
  pnref: z.string(),
  status: z.string(),
  status_display: z.string(),
  order_date: z.string(),
  delivery_date: z.string(),
  shipped_date: z.string().nullable(),
  amount: z.string(),
  payment_method: z.string(),
  comments: z.string().nullable(),
  recipient: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
  }),
  greeting_message: z.string().nullable(),
  special_instructions: z.string().nullable(),
  progress: z.array(OrderProgressStepSchema),
  live_tracking_available: z.boolean(),
  has_delivery_video: z.boolean(),
  has_delivery_photo: z.boolean(),
  items: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      quantity: z.number(),
      selling_price: z.number(),
    })
  ),
});
export type TrackOrderOutput = z.infer<typeof TrackOrderOutputSchema>;

// ─── Tool name union ──────────────────────────────────────────────────────────

export type KaprukaTool =
  | "kapruka_list_categories"
  | "kapruka_search_products"
  | "kapruka_get_product"
  | "kapruka_list_delivery_cities"
  | "kapruka_check_delivery"
  | "kapruka_create_order"
  | "kapruka_track_order";
