"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types/domain";

export interface SavedOrder {
  order: Order;
  savedAt: number;        // epoch ms
  itemNames: string[];    // for display — extracted from the chat context
  imageUrl?: string | null;
}

export interface SavedTracking {
  status: OrderStatus;
  savedAt: number;
}

interface OrdersStore {
  isOpen: boolean;
  pending: SavedOrder[];        // created but not yet paid (before expires_at)
  tracked: SavedTracking[];     // tracking results

  open: () => void;
  close: () => void;
  toggle: () => void;

  savePendingOrder: (order: Order, itemNames?: string[], imageUrl?: string | null) => void;
  saveTracking: (status: OrderStatus) => void;
  removePending: (orderRef: string) => void;
  removeTracking: (orderNumber: string) => void;
  pruneExpired: () => void;
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      isOpen: false,
      pending: [],
      tracked: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      savePendingOrder: (order, itemNames = [], imageUrl = null) => {
        set((s) => {
          // Replace if same ref already exists
          const filtered = s.pending.filter((p) => p.order.order_ref !== order.order_ref);
          return { pending: [{ order, savedAt: Date.now(), itemNames, imageUrl }, ...filtered] };
        });
      },

      saveTracking: (status) => {
        set((s) => {
          const filtered = s.tracked.filter((t) => t.status.order_number !== status.order_number);
          return { tracked: [{ status, savedAt: Date.now() }, ...filtered] };
        });
      },

      removePending: (orderRef) => {
        set((s) => ({ pending: s.pending.filter((p) => p.order.order_ref !== orderRef) }));
      },

      removeTracking: (orderNumber) => {
        set((s) => ({ tracked: s.tracked.filter((t) => t.status.order_number !== orderNumber) }));
      },

      pruneExpired: () => {
        const now = Date.now();
        set((s) => ({
          pending: s.pending.filter((p) => new Date(p.order.expires_at).getTime() > now),
        }));
      },
    }),
    {
      name: "kapruka-orders-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as never)
      ),
      partialize: (s) => ({ pending: s.pending, tracked: s.tracked }),
    }
  )
);
