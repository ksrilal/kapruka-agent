"use client";

import { create } from "zustand";
import type { CustomerAddress } from "@/types/domain";

type FetchStatus = "idle" | "loading" | "error";

interface AddressesStore {
  isOpen: boolean;
  addresses: CustomerAddress[];
  status: FetchStatus;
  error: string | null;
  fetchedAt: number | null;

  open: () => void;
  close: () => void;
  toggle: () => void;
  fetchAddresses: (email: string) => Promise<void>;
}

// Deliberately NOT persisted and NOT identity-scoped — this panel always pulls
// fresh from MCP on open (like Orders' live tracking), it never trusts a
// locally-cached snapshot.
export const useAddressesStore = create<AddressesStore>()((set) => ({
  isOpen: false,
  addresses: [],
  status: "idle",
  error: null,
  fetchedAt: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  fetchAddresses: async (email: string) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        set({ status: "error", error: data.error ?? "Failed to load addresses" });
        return;
      }
      const data = await res.json() as { addresses: CustomerAddress[]; fetchedAt: number };
      set({ status: "idle", addresses: data.addresses, fetchedAt: data.fetchedAt, error: null });
    } catch {
      set({ status: "error", error: "Network error — please try again." });
    }
  },
}));
