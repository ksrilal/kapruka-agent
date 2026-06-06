import type { Locale } from "./domain";
import type { ProductSummary } from "./domain";
import type { Order, OrderStatus } from "./domain";

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

export interface ChatTextEvent {
  type: "text";
  text: string;
}

export interface ChatToolCallEvent {
  type: "tool_call";
  tool: string;
  status: "running" | "done";
}

export type ChatSSEEvent =
  | ChatTextEvent
  | ChatErrorEvent
  | ChatProductsEvent
  | ChatOrderEvent
  | ChatOrderStatusEvent
  | ChatToolCallEvent;
