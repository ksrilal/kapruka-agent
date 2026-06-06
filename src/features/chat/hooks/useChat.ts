"use client";

import { useCallback, useRef, useEffect } from "react";
import { useChatStore } from "../store";
import { useShopStore } from "@/features/shop/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { detectLocale } from "@/lib/utils/unicode";
import type { ConversationMessage } from "@/types/domain";
import type { ChatSSEEvent } from "@/types/ai";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat() {
  const { messages, locale, isStreaming, addMessage, appendAssistantText, setMessageError, setStreaming, setLocale } =
    useChatStore();
  const setFeaturedProducts = useShopStore((s) => s.setFeaturedProducts);
  const setLastAiText = useShopStore((s) => s.setLastAiText);
  const savePendingOrder = useOrdersStore((s) => s.savePendingOrder);
  const saveTracking = useOrdersStore((s) => s.saveTracking);
  const openOrdersPanel = useOrdersStore((s) => s.open);
  const saveSession = useHistoryStore((s) => s.saveSession);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-save to history when page unloads — uses stable sessionId so refresh never duplicates
  useEffect(() => {
    function onUnload() {
      const { messages, sessionId } = useChatStore.getState();
      if (messages.length > 1 && sessionId) {
        useHistoryStore.getState().saveSession(messages, sessionId);
      }
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !text.trim()) return;

      const detectedLocale = detectLocale(text);
      setLocale(detectedLocale);

      const userMsg: ConversationMessage = {
        id: nanoid(),
        role: "user",
        content: text,
        locale: detectedLocale,
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      const assistantId = nanoid();
      const assistantMsg: ConversationMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      // Build history for Gemini: text content only — products/order data are UI state,
      // not conversational context, and bloat the token count significantly.
      const history = useChatStore
        .getState()
        .messages
        .slice(0, -1) // drop the empty assistant msg we just added
        .filter((m) =>
          (m.role === "user" || m.role === "assistant") &&
          m.content.trim() !== "" &&
          !m.isError
        )
        .map((m) => ({
          role: m.role === "user" ? "user" : ("model" as "user" | "model"),
          parts: [{ text: m.content }],
        }));
      history.push({ role: "user", parts: [{ text }] });

      abortRef.current = new AbortController();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, locale: detectedLocale }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let accText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            const event = JSON.parse(json) as ChatSSEEvent;

            if (event.type === "tool_call") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) => {
                  if (m.id !== assistantId) return m;
                  const existing = m.toolSteps ?? [];
                  if (event.status === "running") {
                    return { ...m, toolSteps: [...existing, { tool: event.tool, status: "running" as const }] };
                  }
                  return {
                    ...m,
                    toolSteps: existing.map((step) =>
                      step.tool === event.tool && step.status === "running"
                        ? { ...step, status: "done" as const }
                        : step
                    ),
                  };
                }),
              }));
            } else if (event.type === "text") {
              appendAssistantText(assistantId, event.text);
              accText += event.text;
              setLastAiText(accText);
            } else if (event.type === "products") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, products: event.products } : m
                ),
              }));
              setFeaturedProducts(event.products);
            } else if (event.type === "order") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, order: event.order } : m
                ),
              }));
              // Persist order to localStorage so it survives refresh
              const cartItems = useChatStore.getState().messages
                .filter((m) => m.products && m.products.length > 0)
                .flatMap((m) => m.products ?? [])
                .map((p) => p.name);
              savePendingOrder(event.order, cartItems);
              openOrdersPanel();
            } else if (event.type === "orderStatus") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, orderStatus: event.orderStatus } : m
                ),
              }));
              saveTracking(event.orderStatus);
            } else if (event.type === "error") {
              setMessageError(assistantId, event.retryable ?? false);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Remove the empty assistant placeholder on abort
          useChatStore.setState((s) => ({
            messages: s.messages.filter((m) => m.id !== assistantId || m.content !== ""),
          }));
          return;
        }
        console.error(err);
        setMessageError(assistantId, true);
      } finally {
        setStreaming(false);
        // If the assistant message is still empty after streaming (no text, no cards),
        // remove the orphan bubble entirely rather than showing a blank
        const finalMsg = useChatStore.getState().messages.find((m) => m.id === assistantId);
        if (finalMsg && !finalMsg.content && !finalMsg.products && !finalMsg.order && !finalMsg.orderStatus && !finalMsg.isError) {
          useChatStore.setState((s) => ({
            messages: s.messages.filter((m) => m.id !== assistantId),
          }));
        }
      }
    },
    [isStreaming, addMessage, appendAssistantText, setMessageError, setStreaming, setLocale, setFeaturedProducts, setLastAiText, savePendingOrder, saveTracking, openOrdersPanel]
  );

  const retry = useCallback(
    (messageId: string) => {
      const msgs = useChatStore.getState().messages;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx < 1) return;
      const userMsg = msgs[idx - 1];
      if (userMsg.role !== "user") return;
      useChatStore.setState({ messages: msgs.filter((m) => m.id !== messageId) });
      void sendMessage(userMsg.content);
    },
    [sendMessage]
  );

  const newChat = useCallback(() => {
    const { messages, sessionId } = useChatStore.getState();
    if (messages.length > 1 && sessionId) saveSession(messages, sessionId);
    useChatStore.getState().reset();
  }, [saveSession]);

  const stop = useCallback(() => { abortRef.current?.abort(); }, []);

  return { messages, locale, isStreaming, sendMessage, retry, stop, newChat };
}
