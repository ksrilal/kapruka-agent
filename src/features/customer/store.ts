"use client";

import { create } from "zustand";
import { setStorageIdentity } from "@/lib/utils/scoped-storage";
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
// browser tab/session. Cart/orders/chat/recipients stores each keep a separate,
// identity-scoped local cache (see scoped-storage.ts) — onboard()/logout() flip
// which one is active, they never merge guest and account data together.
export const useCustomerStore = create<CustomerStore>()((set) => ({
  account: null,
  status: "idle",
  error: null,

  startLookup: () => set({ status: "loading", error: null }),
  onboard: (account) => {
    set({ account, status: "idle", error: null });
    void setStorageIdentity(account.email);
  },
  fail: (error) => set({ status: "error", error, account: null }),
  logout: () => {
    set({ account: null, status: "idle", error: null });
    void setStorageIdentity(null);
  },
}));
