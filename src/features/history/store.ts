"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConversationMessage } from "@/types/domain";

export interface SavedSession {
  id: string;
  savedAt: number;
  title: string;          // first user message, truncated
  preview: string;        // first assistant reply snippet
  messageCount: number;
  messages: ConversationMessage[];
}

const MAX_SESSIONS = 5;
// Keep products/order/orderStatus for card restoration.
// Cap products at 8 items and text at 500 chars to stay within localStorage budget.
function trimMessages(msgs: ConversationMessage[]): ConversationMessage[] {
  return msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      ...m,
      content: m.content.slice(0, 500),
      products: m.products ? m.products.slice(0, 8) : undefined,
    }));
}

interface HistoryStore {
  sessions: SavedSession[];
  isOpen: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;

  saveSession: (messages: ConversationMessage[], sessionId: string) => void;
  deleteSession: (id: string) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      saveSession(messages, sessionId) {
        const userMsgs = messages.filter((m) => m.role === "user");
        const asstMsgs = messages.filter((m) => m.role === "assistant" && m.content);
        if (userMsgs.length === 0) return;

        const title = userMsgs[0].content.slice(0, 60);
        const preview = asstMsgs[0]?.content.slice(0, 120) ?? "";
        const messageCount = messages.filter((m) => m.role === "user" || m.role === "assistant").length;

        const existing = get().sessions;

        // If a session with this stable ID already exists, update it in place
        const dupIdx = existing.findIndex((s) => s.id === sessionId);
        if (dupIdx !== -1) {
          const updated = [...existing];
          updated[dupIdx] = { ...updated[dupIdx], savedAt: Date.now(), preview, messageCount, messages: trimMessages(messages) };
          set({ sessions: updated });
          return;
        }

        const session: SavedSession = {
          id: sessionId,
          savedAt: Date.now(),
          title,
          preview,
          messageCount,
          messages: trimMessages(messages),
        };

        set({ sessions: [session, ...existing].slice(0, MAX_SESSIONS) });
      },

      deleteSession(id) {
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
      },

      clearAll() {
        set({ sessions: [] });
      },
    }),
    {
      name: "kiyo-history-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as never)
      ),
      partialize: (s) => ({ sessions: s.sessions }),
    }
  )
);
