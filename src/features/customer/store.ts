"use client";

import { create } from "zustand";
import { setStorageIdentity } from "@/lib/utils/scoped-storage";
import { useChatStore } from "@/features/chat/store";
import { useHistoryStore } from "@/features/history/store";
import { useAddressesStore } from "@/features/addresses/store";
import type { CustomerAccount } from "@/types/domain";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

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
    // Save the account's active conversation to its own (still-current)
    // history scope before switching back to guest — otherwise it's lost
    // and won't be there next time this account logs in.
    const chatState = useChatStore.getState();
    if (chatState.messages.length > 1 && chatState.sessionId) {
      useHistoryStore.getState().saveSession(chatState.messages, chatState.sessionId);
    }
    useChatStore.getState().reset();
    useChatStore.setState({ sessionId: nanoid() });

    set({ account: null, status: "idle", error: null });
    void setStorageIdentity(null);

    // Addresses are never cached across identities — clear on logout so a
    // still-open panel doesn't keep showing the previous account's data.
    useAddressesStore.setState({ isOpen: false, addresses: [], status: "idle", error: null, fetchedAt: null });
  },
}));
