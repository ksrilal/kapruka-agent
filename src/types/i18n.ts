export type { Locale } from "./domain";

export interface Messages {
  chat: {
    placeholder: string;
    greeting: string;
    error: {
      retry: string;
      mcp_unavailable: string;
    };
    voice: {
      start: string;
      stop: string;
      confirm: string;
    };
  };
  cart: {
    title: string;
    empty: string;
    add: string;
    remove: string;
    checkout: string;
    item_count: string;
    subtotal: string;
  };
  product: {
    add_to_cart: string;
    in_stock: string;
    out_of_stock: string;
    view_details: string;
  };
  checkout: {
    title: string;
    recipient_name: string;
    recipient_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_date: string;
    gift_message: string;
    sender_name: string;
    place_order: string;
    payment_url: string;
    order_ref: string;
    expires_in: string;
  };
  nav: {
    home: string;
    cart: string;
  };
  locale: {
    en: string;
    si: string;
    "ta-Latn": string;
  };
}
