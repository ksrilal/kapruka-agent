"use client";

import { useCallback, useRef, useEffect } from "react";
import { useChatStore } from "../store";
import { useShopStore } from "@/features/shop/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { useCartStore } from "@/features/cart/store";
import { detectLocale } from "@/lib/utils/unicode";
import { productId } from "@/types/domain";
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
  const addCartItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
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

      // Build history: text content only — products/order data are UI state,
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
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      history.push({ role: "user", content: text });

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
              // Persist order to localStorage so it survives refresh.
              // Use only the most recent products card as a best-guess for what's
              // in this order — flattening every card shown all session would mix
              // in unrelated products from earlier searches (e.g. user browsed
              // chocolates, then flowers, then ordered the flowers: showing
              // "chocolates, flowers" on the order would be misleading).
              const recentProducts = [...useChatStore.getState().messages]
                .reverse()
                .find((m) => m.products && m.products.length > 0)
                ?.products ?? [];
              const cartItems = recentProducts.map((p) => p.name);
              const imageUrl = recentProducts[0]?.image_url ?? null;
              savePendingOrder(event.order, cartItems, imageUrl);
              openOrdersPanel();
              // Order confirmed — remove the items that were actually checked
              // out from the cart. The checkout request (CartPanel) tags each
              // product with [product_id:xxx]. create_order needs several fields
              // collected conversationally across multiple turns (see TOOL RULES),
              // so the tagged message is rarely the LAST user message by the time
              // the order lands — scan user turns since the previous order in
              // this session (so a stale tag from an earlier, separate checkout
              // episode that never completed isn't re-applied to this one).
              const allMsgs = useChatStore.getState().messages;
              const prevOrderIdx = (() => {
                for (let i = allMsgs.length - 2; i >= 0; i--) {
                  if (allMsgs[i].order) return i;
                }
                return -1;
              })();
              const taggedIds = new Set(
                allMsgs
                  .slice(prevOrderIdx + 1)
                  .filter((m) => m.role === "user")
                  .flatMap((m) => [...m.content.matchAll(/\[product_id:([^\]]+)\]/g)].map((mt) => mt[1]))
              );
              for (const pid of taggedIds) {
                useCartStore.getState().removeItem(pid);
              }
            } else if (event.type === "cartAction") {
              // Resolve the AI's product_id against products already shown in
              // this conversation — the AI only knows IDs, not full ProductSummary objects.
              const known = useChatStore.getState().messages
                .flatMap((m) => m.products ?? []);
              const product = known.find((p) => productId(p) === event.productId);
              if (product) {
                addCartItem(product, event.quantity);
                openCart();
              } else {
                // AI referenced a product_id that was never actually shown this
                // session — likely a hallucinated/stale ID. Don't touch the cart;
                // log so this is visible if the model starts doing it often.
                console.warn({ event: "cart_action_unresolved_product", productId: event.productId });
              }
            } else if (event.type === "orderStatus") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, orderStatus: event.orderStatus } : m
                ),
              }));
              saveTracking(event.orderStatus);
            } else if (event.type === "error") {
              setMessageError(assistantId, event.retryable ?? false, event.message);
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
        // Remove orphan bubble only if it has absolutely nothing to show.
        // Read state inside setState so we see the final committed value —
        // avoids a race where isError was just set but not yet visible.
        useChatStore.setState((s) => {
          const finalMsg = s.messages.find((m) => m.id === assistantId);
          if (
            finalMsg &&
            !finalMsg.content &&
            !finalMsg.products?.length &&
            !finalMsg.order &&
            !finalMsg.orderStatus &&
            !finalMsg.isError &&
            !finalMsg.toolSteps?.length
          ) {
            return { messages: s.messages.filter((m) => m.id !== assistantId) };
          }
          return s;
        });
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
