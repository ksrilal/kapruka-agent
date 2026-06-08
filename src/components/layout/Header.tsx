"use client";

import { ShoppingCart, Package, History, SquarePen, Sun, Moon } from "lucide-react";
import { KiyoAvatar } from "@/components/ui/KiyoAvatar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCartStore } from "@/features/cart/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { useChatStore } from "@/features/chat/store";
import { useChat } from "@/features/chat/hooks/useChat";
import { useThemeStore, syncThemeFromDom } from "@/features/theme/store";

export function Header() {
  const toggleCart = useCartStore((s) => s.toggle);
  const cartItemCount = useCartStore((s) => s.itemCount);

  const toggleOrders = useOrdersStore((s) => s.toggle);
  const pendingOrders = useOrdersStore((s) => s.pending);

  const toggleHistory = useHistoryStore((s) => s.toggle);
  const historySessions = useHistoryStore((s) => s.sessions);

  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const { newChat, isStreaming } = useChat();
  const router = useRouter();

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  function goHome() {
    newChat();
    router.push("/");
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    syncThemeFromDom();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cartCount = mounted ? cartItemCount() : 0;
  const ordersCount = mounted ? pendingOrders.length : 0;
  const historyCount = mounted ? historySessions.length : 0;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-4 sm:px-6 lg:px-10"
      style={{ background: "transparent", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
    >
      <div className="flex h-16 items-center justify-between">
        <button
          onClick={goHome}
          className="flex items-center gap-3 cursor-pointer text-left w-auto"
          aria-label="Go to home"
        >
          <KiyoAvatar size={36} />
          <div className="flex flex-col justify-center">
            <span className="text-[15px] font-bold leading-tight tracking-tight text-foreground">
              KI<span className="gradient-text">YO</span>
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              Your shopping assistant
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* New chat — only visible when a conversation is active */}
          {mounted && hasMessages && (
            <button
              onClick={newChat}
              disabled={isStreaming}
              title="New chat"
              aria-label="New chat"
              className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 h-9 text-[12px] font-medium transition-all hover:-translate-y-px active:scale-95 disabled:opacity-40"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
            >
              <SquarePen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}

          {/* History button */}
          <div className="relative">
            <button
              onClick={toggleHistory}
              aria-label="Chat history"
              title="Chat History"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
            >
              <History className="h-4 w-4" />
            </button>
            {historyCount > 0 && (
              <span className="badge-count" style={{ background: "var(--purple)" }}>
                {historyCount}
              </span>
            )}
          </div>

          {/* Orders button */}
          <div className="relative">
            <button
              onClick={toggleOrders}
              aria-label="My orders"
              title="My Orders"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
            >
              <Package className="h-4 w-4" />
            </button>
            {ordersCount > 0 && (
              <span className="badge-count" style={{ background: "var(--gold)" }}>
                {ordersCount}
              </span>
            )}
          </div>

          {/* Cart button */}
          <div className="relative">
            <button
              onClick={toggleCart}
              aria-label="Open cart"
              title="Cart"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            {cartCount > 0 && (
              <span className="badge-count">{cartCount > 99 ? "99+" : cartCount}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
