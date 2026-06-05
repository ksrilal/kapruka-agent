"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { productId, productPrice } from "@/types/domain";
import type { ProductSummary } from "@/types/domain";

export interface CartLineItem {
  product: ProductSummary;
  quantity: number;
  icing_text?: string;
}

interface CartStore {
  items: CartLineItem[];
  isOpen: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;

  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateIcing: (id: string, text: string) => void;
  clear: () => void;

  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (product, quantity = 1) => {
        set((s) => {
          const pid = productId(product);
          const existing = s.items.find((i) => productId(i.product) === pid);
          if (existing) {
            return {
              items: s.items.map((i) =>
                productId(i.product) === pid
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...s.items, { product, quantity }] };
        });
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => productId(i.product) !== id) }));
      },

      updateQuantity: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return; }
        set((s) => ({
          items: s.items.map((i) =>
            productId(i.product) === id ? { ...i, quantity: qty } : i
          ),
        }));
      },

      updateIcing: (id, text) => {
        set((s) => ({
          items: s.items.map((i) =>
            productId(i.product) === id ? { ...i, icing_text: text } : i
          ),
        }));
      },

      clear: () => set({ items: [] }),

      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((s, i) => s + productPrice(i.product) * i.quantity, 0),
    }),
    {
      name: "kapruka-cart-v2",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : (undefined as never)
      ),
      partialize: (s) => ({ items: s.items }),
    }
  )
);
