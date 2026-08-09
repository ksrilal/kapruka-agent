"use client";

import { useCallback, useRef, useEffect } from "react";
import { useChatStore } from "../store";
import { useShopStore } from "@/features/shop/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { useCartStore } from "@/features/cart/store";
import { useRecipientsStore } from "@/features/recipients/store";
import type { SavedRecipient } from "@/features/recipients/store";
import { useCustomerStore } from "@/features/customer/store";
import { detectLocale } from "@/lib/utils/unicode";
import { productId } from "@/types/domain";
import type { ConversationMessage, CustomerAccount, OrderStatus, Locale } from "@/types/domain";
import type { ChatSSEEvent } from "@/types/ai";

// These render as Kiyo chat bubbles (role: "assistant") but are fired from
// client-side lookup outcomes rather than the model itself, so they need
// their own locale-aware text rather than inheriting it from a model reply.
const ACCOUNT_LOOKUP_TEXT: Record<Locale, {
  welcomeBack: (name: string) => string;
  notFound: string;
  lookupError: string;
}> = {
  en: {
    welcomeBack: (name) => `Welcome back, ${name}! I've pulled up your account — feel free to ask about past orders, saved addresses, or start shopping.`,
    notFound: "I couldn't find an account for that email — mind double-checking it, or we can continue as a guest?",
    lookupError: "I ran into a problem pulling up your account — let's try again in a moment, or I'm happy to help as a guest for now.",
  },
  si: {
    welcomeBack: (name) => `ආයුබෝවන් ${name}! මම ඔයාගේ ගිණුම ගෙනාවා — පරණ ඕඩර්ස්, සේව් කරපු ලිපින ගැන අහන්න, නැත්නම් සොපිං පටන් ගන්න.`,
    notFound: "මට ඒ ඊමේල් එකට ගිණුමක් හොයාගන්න බැරි උනා — එක නැවත චෙක් කරන්න, නැත්නම් අපි ගෙස්ට් විදිහට කරගෙන යමුද?",
    lookupError: "ඔයාගේ ගිණුම ගේනකොට ප්‍රශ්නයක් ආවා — ටිකකින් ආයෙත් ට්‍රයි කරමු, නැත්නම් මම ගෙස්ට් විදිහට උදව් කරන්නම්.",
  },
  "ta-Latn": {
    welcomeBack: (name) => `Vanakkam ${name}! Unga account eduthutten — past orders, saved addresses pathi kekkalam, illa shopping start pannalam.`,
    notFound: "Andha email-ku account onnum theriyala — thirumba check pannunga, illa guest ah continue pannalama?",
    lookupError: "Unga account eduka problem vandhuchu — konjam neram kalichi try pannuvom, illa naan guest ah help pannaren.",
  },
};

// Resolves an account's order history (thin CustomerOrderSummary entries) into
// full OrderStatus objects the Orders panel actually renders (status_display,
// progress steps, etc.) — /api/customer doesn't carry enough detail on its own.
async function fetchAccountOrderStatuses(account: CustomerAccount): Promise<OrderStatus[]> {
  const results = await Promise.all(
    account.orders.map(async (o) => {
      try {
        const res = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_number: o.order_ref }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { status?: OrderStatus };
        return data.status ?? null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((s): s is OrderStatus => s !== null);
}

// The Kapruka API sometimes returns address fields with stray HTML artifacts
// (e.g. a trailing "<BR" from a rich-text field never closed/stripped) —
// clean those up before they reach the UI or get used for dedup comparison.
function cleanAddressField(value: string): string {
  return value.replace(/<[^>]*>?/g, "").replace(/\s+/g, " ").trim();
}

// Same physical address can come back from the API more than once with
// cosmetically different formatting (casing, trailing HTML, punctuation) —
// compare on a normalized key so those collapse into one recipient instead
// of showing as separate entries.
function normalizedAddressKey(name: string, phone: string, address: string, city: string): string {
  return [name, phone, address, city].map((v) => cleanAddressField(v).toLowerCase()).join("|");
}

// Turns an account's saved addresses (from /api/customer) into SavedRecipient
// entries the Recipients panel renders — mirrors fetchAccountOrderStatuses'
// role for the Orders panel, since /api/customer's shape doesn't match either
// panel's UI needs directly.
function buildRecipientsFromAddresses(account: CustomerAccount): SavedRecipient[] {
  const seen = new Set<string>();
  const result: SavedRecipient[] = [];
  for (const [i, a] of account.addresses.entries()) {
    const name = cleanAddressField(a.recipient_name);
    const phone = cleanAddressField(a.phone ?? account.profile.phone ?? "");
    const address = cleanAddressField(a.address);
    const city = cleanAddressField(a.city);
    const key = normalizedAddressKey(name, phone, address, city);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: `${account.email}-addr-${i}`,
      label: cleanAddressField(a.label ?? "") || name,
      recipient: { name, phone, address, city },
      savedAt: Date.now(),
    });
  }
  return result;
}

// Compact, model-friendly summary of an onboarded account — folded into the
// system prompt server-side (see buildSystemPrompt's customerContext param).
function buildCustomerContext(account: CustomerAccount, preferredCurrency?: string | null): string {
  const lines: string[] = [`Name: ${account.profile.name}`, `Email: ${account.email}`];
  if (account.profile.phone) lines.push(`Phone: ${account.profile.phone}`);
  if (preferredCurrency) lines.push(`Preferred currency: ${preferredCurrency}`);
  if (account.orders.length > 0) {
    lines.push("Recent orders:");
    for (const o of account.orders.slice(0, 5)) {
      const items = o.items?.map((i) => (i.product_id ? `${i.name} [${i.product_id}]` : i.name)).join(", ") ?? "";
      lines.push(`  - ${o.order_ref} (${o.status})${items ? `: ${items}` : ""}`);
    }
  }
  if (account.addresses.length > 0) {
    lines.push("Saved addresses:");
    for (const a of account.addresses.slice(0, 5)) {
      lines.push(`  - ${a.label ? `${a.label}: ` : ""}${a.recipient_name}, ${a.address}, ${a.city}`);
    }
  }
  return lines.join("\n");
}

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

      // A locale explicitly picked from the header dropdown is a stronger
      // signal than word-sniffing this one message — only let auto-detection
      // override it when the message clearly isn't English (e.g. the user
      // switches to typing Sinhala mid-conversation despite having picked
      // English), so a manual "English" pick doesn't get silently flipped by
      // a stray Tanglish word in an otherwise English sentence.
      const preferredLocale = useShopStore.getState().preferredLocale;
      const autoDetected = detectLocale(text);
      const usingPreference = Boolean(preferredLocale && autoDetected === "en");
      const detectedLocale = usingPreference ? preferredLocale! : autoDetected;
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

      const onboardedAccount = useCustomerStore.getState().account;
      const preferredCurrency = useShopStore.getState().preferredCurrency ?? undefined;
      const customerContext = onboardedAccount
        ? buildCustomerContext(onboardedAccount, preferredCurrency)
        : undefined;
      const customerEmail = onboardedAccount?.email;

      abortRef.current = new AbortController();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, locale: detectedLocale, isExplicitLocale: usingPreference, customerContext, customerEmail, preferredCurrency }),
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
            } else if (event.type === "giftProfile") {
              useChatStore.setState((s) => ({
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, giftProfile: event.giftProfile } : m
                ),
              }));
            } else if (event.type === "customerLookup") {
              const customerStore = useCustomerStore.getState();
              if (customerStore.account?.email !== event.email) {
                customerStore.startLookup();
                fetch("/api/customer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: event.email }),
                })
                  .then(async (r) => {
                    if (!r.ok) {
                      const body = await r.json().catch(() => ({}));
                      throw new Error(body.error ?? `HTTP ${r.status}`);
                    }
                    return r.json();
                  })
                  .then(async (account: CustomerAccount) => {
                    // Signing in mid-conversation starts a fresh session for this
                    // account rather than continuing the guest thread — save the
                    // guest conversation to guest-scoped history first (still on
                    // guest storage at this point), then reset before onboard()
                    // flips storage to the account's own scope.
                    const guestState = useChatStore.getState();
                    if (guestState.messages.length > 1 && guestState.sessionId) {
                      useHistoryStore.getState().saveSession(guestState.messages, guestState.sessionId);
                    }
                    useChatStore.getState().reset();
                    // reset() clears sessionId, but addMessage() below adds an
                    // assistant message first — which wouldn't claim a new
                    // sessionId (only user messages do) — so this account's
                    // session would never get a stable ID to save history under.
                    useChatStore.setState({ sessionId: nanoid() });

                    // onboard() flips local storage to this account's own scope
                    // (see scoped-storage.ts) before we populate it below, so
                    // guest-session cart/orders/recipients never bleed in.
                    useCustomerStore.getState().onboard(account);
                    const firstName = account.profile.name.split(" ")[0];
                    addMessage({
                      id: nanoid(),
                      role: "assistant",
                      content: ACCOUNT_LOOKUP_TEXT[detectedLocale].welcomeBack(firstName),
                      timestamp: Date.now(),
                    });
                    if (account.orders.length > 0) {
                      const statuses = await fetchAccountOrderStatuses(account);
                      if (statuses.length > 0) {
                        useOrdersStore.getState().replaceTracked(statuses);
                        useOrdersStore.getState().open();
                      }
                    }
                    if (account.addresses.length > 0) {
                      useRecipientsStore
                        .getState()
                        .replaceRecipients(buildRecipientsFromAddresses(account));
                    }
                  })
                  .catch((err) => {
                    const message = (err as Error).message;
                    useCustomerStore.getState().fail(message);
                    addMessage({
                      id: nanoid(),
                      role: "assistant",
                      content:
                        message === "No account found for this email"
                          ? ACCOUNT_LOOKUP_TEXT[detectedLocale].notFound
                          : ACCOUNT_LOOKUP_TEXT[detectedLocale].lookupError,
                      timestamp: Date.now(),
                    });
                  });
              }
            } else if (event.type === "currencyPreference") {
              useShopStore.getState().setPreferredCurrency(event.currency);
            } else if (event.type === "languagePreference") {
              // Syncs the header language button too — same mechanism as
              // currencyPreference above, so a chat-driven "reply in Sinhala"
              // request doesn't leave the button showing a stale language.
              useShopStore.getState().setPreferredLocale(event.locale);
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
            !finalMsg.giftProfile &&
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
