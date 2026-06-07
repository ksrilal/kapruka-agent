"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types/domain";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const TERMINAL_STATUSES = new Set(["delivered", "cancelled"]);

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

export interface SavedOrder {
  order: Order;
  savedAt: number;
  itemNames: string[];
  imageUrl?: string | null;
}

export interface SavedTracking {
  status: OrderStatus;
  savedAt: number;
  lastPolledAt?: number;
}

interface OrdersStore {
  isOpen: boolean;
  pending: SavedOrder[];
  tracked: SavedTracking[];

  open: () => void;
  close: () => void;
  toggle: () => void;

  savePendingOrder: (order: Order, itemNames?: string[], imageUrl?: string | null) => void;
  saveTracking: (status: OrderStatus) => void;
  updateTracking: (orderNumber: string, status: OrderStatus) => void;
  stampPolled: (orderNumber: string, at: number) => void;
  promotePendingToTracked: (orderRef: string, status: OrderStatus) => void;
  removePending: (orderRef: string) => void;
  removeTracking: (orderNumber: string) => void;
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
          const filtered = s.pending.filter((p) => p.order.order_ref !== order.order_ref);
          return { pending: [{ order, savedAt: Date.now(), itemNames, imageUrl }, ...filtered] };
        });
      },

      saveTracking: (status) => {
        set((s) => {
          const filtered = s.tracked.filter((t) => t.status.order_number !== status.order_number);
          return { tracked: [{ status, savedAt: Date.now(), lastPolledAt: Date.now() }, ...filtered] };
        });
      },

      updateTracking: (orderNumber, status) => {
        set((s) => ({
          tracked: s.tracked.map((t) =>
            t.status.order_number === orderNumber
              ? { ...t, status, lastPolledAt: Date.now() }
              : t
          ),
        }));
      },

      stampPolled: (orderNumber, at) => {
        set((s) => ({
          tracked: s.tracked.map((t) =>
            t.status.order_number === orderNumber ? { ...t, lastPolledAt: at } : t
          ),
        }));
      },

      // Called when user confirms payment: removes from pending, adds to tracked
      promotePendingToTracked: (orderRef, status) => {
        set((s) => {
          const pending = s.pending.filter((p) => p.order.order_ref !== orderRef);
          const filtered = s.tracked.filter((t) => t.status.order_number !== status.order_number);
          return {
            pending,
            tracked: [{ status, savedAt: Date.now() }, ...filtered],
          };
        });
      },

      removePending: (orderRef) => {
        set((s) => ({ pending: s.pending.filter((p) => p.order.order_ref !== orderRef) }));
      },

      removeTracking: (orderNumber) => {
        set((s) => ({ tracked: s.tracked.filter((t) => t.status.order_number !== orderNumber) }));
      },
    }),
    {
      name: "kapruka-orders-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      partialize: (s) => ({ pending: s.pending, tracked: s.tracked }),
    }
  )
);
