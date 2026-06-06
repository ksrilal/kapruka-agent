"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProductSummary } from "@/types/domain";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

interface ShopStore {
  cartOpen: boolean;
  commandOpen: boolean;
  searchRef: React.RefObject<HTMLTextAreaElement | null> | null;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  openCommand: () => void;
  closeCommand: () => void;

  focusSearch: () => void;
  setSearchRef: (ref: React.RefObject<HTMLTextAreaElement | null>) => void;

  // Registered sendMessage function from useChat — lets CartPanel trigger AI
  sendMessage: ((text: string) => void) | null;
  registerSendMessage: (fn: (text: string) => void) => void;

  // Featured products shown in grid — persisted in sessionStorage
  featuredProducts: ProductSummary[];
  setFeaturedProducts: (products: ProductSummary[]) => void;

  // Last AI response text — persisted in sessionStorage
  lastAiText: string;
  setLastAiText: (text: string) => void;
}

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      cartOpen: false,
      commandOpen: false,
      searchRef: null,
      sendMessage: null,
      featuredProducts: [],
      lastAiText: "",

      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),
      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),

      openCommand: () => set({ commandOpen: true }),
      closeCommand: () => set({ commandOpen: false }),

      focusSearch: () => {
        set({ commandOpen: true });
        setTimeout(() => get().searchRef?.current?.focus(), 50);
      },

      setSearchRef: (ref) => set({ searchRef: ref }),
      registerSendMessage: (fn) => set({ sendMessage: fn }),
      setFeaturedProducts: (products) => {
        // Deduplicate by id — keep last occurrence so newer data wins
        const seen = new Map<string, ProductSummary>();
        for (const p of products) seen.set(p.id, p);
        set({ featuredProducts: [...seen.values()] });
      },
      setLastAiText: (text) => set({ lastAiText: text }),
    }),
    {
      name: "kapruka-shop",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : noopStorage
      ),
      // Only persist data, not UI state or refs
      partialize: (s) => ({
        featuredProducts: s.featuredProducts,
        lastAiText: s.lastAiText,
      }),
    }
  )
);
