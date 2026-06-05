"use client";

import { Toaster } from "@/components/ui/sonner";
import { Header } from "./Header";
import { CommandBar } from "@/features/chat/components/CommandBar";
import { CartPanel } from "@/features/cart/components/CartPanel";
import { OrdersPanel } from "@/features/orders/components/OrdersPanel";
import { HistoryPanel } from "@/features/history/components/HistoryPanel";
import { Bubbles } from "@/components/ui/Bubbles";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden" }}>
      <Bubbles />
      <Header />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", paddingTop: "4rem", paddingBottom: "5.5rem", overflow: "hidden" }}>
        {children}
      </div>
      <CommandBar />
      <CartPanel />
      <OrdersPanel />
      <HistoryPanel />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(24px)",
            color: "var(--ink)",
            borderRadius: "14px",
            boxShadow: "var(--s3)",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
