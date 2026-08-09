"use client";

import { create } from "zustand";
import type { Locale } from "@/types/domain";
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

  // Currency the user has asked for prices in — persisted in sessionStorage,
  // fed into customerContext so the model doesn't have to re-infer it every
  // fresh session/page load (see system-prompt.ts "## currency").
  preferredCurrency: string | null;
  setPreferredCurrency: (currency: string) => void;

  // Language the user has explicitly picked from the header dropdown —
  // persisted in localStorage so it survives across sessions, distinct from
  // the auto-detected-per-message locale in useChatStore (sessionStorage).
  // Applies for guests too, same as preferredCurrency.
  preferredLocale: Locale | null;
  setPreferredLocale: (locale: Locale) => void;
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
      preferredCurrency: null,
      preferredLocale: null,

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
      setPreferredCurrency: (currency) => set({ preferredCurrency: currency }),
      setPreferredLocale: (locale) => set({ preferredLocale: locale }),
    }),
    {
      name: "kapruka-shop",
      // localStorage, not sessionStorage — featuredProducts/lastAiText are
      // fine to lose on tab close, but a manually-picked language/currency
      // should stick around for the next visit too.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      // Only persist data, not UI state or refs
      partialize: (s) => ({
        featuredProducts: s.featuredProducts,
        lastAiText: s.lastAiText,
        preferredCurrency: s.preferredCurrency,
        preferredLocale: s.preferredLocale,
      }),
    }
  )
);
