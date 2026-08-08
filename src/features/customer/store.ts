"use client";

import { create } from "zustand";
import type { CustomerAccount } from "@/types/domain";

type LookupStatus = "idle" | "loading" | "error";

interface CustomerStore {
  account: CustomerAccount | null;
  status: LookupStatus;
  error: string | null;

  startLookup: () => void;
  onboard: (account: CustomerAccount) => void;
  fail: (error: string) => void;
  logout: () => void;
}

// Deliberately NOT persisted — an onboarded session lives only for the current
// browser tab/session. Local-storage-cache personalization (cart/orders/history
// stores) stays untouched and simply resumes once the user logs out.
export const useCustomerStore = create<CustomerStore>()((set) => ({
  account: null,
  status: "idle",
  error: null,

  startLookup: () => set({ status: "loading", error: null }),
  onboard: (account) => set({ account, status: "idle", error: null }),
  fail: (error) => set({ status: "error", error, account: null }),
  logout: () => set({ account: null, status: "idle", error: null }),
}));
