"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OrderTrackingRecipient } from "@/types/domain";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface SavedRecipient {
  id: string;
  label: string; // e.g. "Amma", "Best friend" — defaults to the name
  recipient: OrderTrackingRecipient;
  savedAt: number;
}

const MAX_RECIPIENTS = 20;

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function sameRecipient(a: OrderTrackingRecipient, b: OrderTrackingRecipient): boolean {
  return a.name === b.name && a.phone === b.phone && a.address === b.address && a.city === b.city;
}

interface RecipientsStore {
  isOpen: boolean;
  recipients: SavedRecipient[];

  open: () => void;
  close: () => void;
  toggle: () => void;

  saveRecipient: (recipient: OrderTrackingRecipient, label?: string) => void;
  renameRecipient: (id: string, label: string) => void;
  removeRecipient: (id: string) => void;
  isSaved: (recipient: OrderTrackingRecipient) => boolean;
}

export const useRecipientsStore = create<RecipientsStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      recipients: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      saveRecipient: (recipient, label) => {
        set((s) => {
          if (s.recipients.some((r) => sameRecipient(r.recipient, recipient))) return s;
          const saved: SavedRecipient = {
            id: nanoid(),
            label: label?.trim() || recipient.name,
            recipient,
            savedAt: Date.now(),
          };
          return { recipients: [saved, ...s.recipients].slice(0, MAX_RECIPIENTS) };
        });
      },

      renameRecipient: (id, label) => {
        set((s) => ({
          recipients: s.recipients.map((r) => (r.id === id ? { ...r, label } : r)),
        }));
      },

      removeRecipient: (id) => {
        set((s) => ({ recipients: s.recipients.filter((r) => r.id !== id) }));
      },

      isSaved: (recipient) => get().recipients.some((r) => sameRecipient(r.recipient, recipient)),
    }),
    {
      name: "kapruka-recipients-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      partialize: (s) => ({ recipients: s.recipients }),
    }
  )
);
