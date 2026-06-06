"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConversationMessage, Locale } from "@/types/domain";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

interface ChatStore {
  messages: ConversationMessage[];
  locale: Locale;
  isStreaming: boolean;
  sessionId: string | null;
  addMessage: (msg: ConversationMessage) => void;
  appendAssistantText: (id: string, text: string) => void;
  setMessageError: (id: string, retryable: boolean, errorMessage?: string) => void;
  setStreaming: (v: boolean) => void;
  setLocale: (locale: Locale) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      locale: "en" as Locale,
      isStreaming: false,
      sessionId: null,

      addMessage(msg) {
        set((s) => ({
          messages: [...s.messages, msg],
          sessionId: s.sessionId ?? (msg.role === "user" ? nanoid() : null),
        }));
      },

      appendAssistantText(id, text) {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + text } : m
          ),
        }));
      },

      setMessageError(id, retryable, errorMessage) {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, isError: true, retryable, errorMessage } : m
          ),
        }));
      },

      setStreaming(v) {
        set({ isStreaming: v });
      },

      setLocale(locale) {
        set({ locale });
      },

      reset() {
        set({ messages: [], isStreaming: false, sessionId: null });
      },
    }),
    {
      name: "kiyo-chat-session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : noopStorage
      ),
      // Persist messages + sessionId so refresh stays on the same session.
      // isStreaming is always false on load — don't persist it.
      partialize: (s) => ({
        messages: s.messages,
        sessionId: s.sessionId,
        locale: s.locale,
      }),
    }
  )
);
