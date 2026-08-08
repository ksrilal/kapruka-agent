import type { Locale } from "./domain";
import type { ProductSummary } from "./domain";
import type { Order, OrderStatus, GiftProfile } from "./domain";

export type { Locale };

export interface CartContextItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  locale: Locale;
  cart?: CartContextItem[];
}

export interface ChatErrorEvent {
  type: "error";
  retryable: boolean;
  message: string;
}

export interface ChatProductsEvent {
  type: "products";
  products: ProductSummary[];
}

export interface ChatOrderEvent {
  type: "order";
  order: Order;
}

export interface ChatOrderStatusEvent {
  type: "orderStatus";
  orderStatus: OrderStatus;
}

export interface ChatGiftProfileEvent {
  type: "giftProfile";
  giftProfile: GiftProfile;
}

export interface ChatTextEvent {
  type: "text";
  text: string;
}

export interface ChatToolCallEvent {
  type: "tool_call";
  tool: string;
  status: "running" | "done";
}

export interface ChatCartActionEvent {
  type: "cartAction";
  action: "add";
  productId: string;
  quantity: number;
}

export interface ChatCustomerLookupEvent {
  type: "customerLookup";
  email: string;
}

export interface ChatCurrencyPreferenceEvent {
  type: "currencyPreference";
  currency: string;
}

export type ChatSSEEvent =
  | ChatTextEvent
  | ChatErrorEvent
  | ChatProductsEvent
  | ChatOrderEvent
  | ChatOrderStatusEvent
  | ChatToolCallEvent
  | ChatCartActionEvent
  | ChatGiftProfileEvent
  | ChatCustomerLookupEvent
  | ChatCurrencyPreferenceEvent;
