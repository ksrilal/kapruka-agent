"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "./Header";
import { CommandBar } from "@/features/chat/components/CommandBar";
import { CartPanel } from "@/features/cart/components/CartPanel";
import { OrdersPanel } from "@/features/orders/components/OrdersPanel";
import { HistoryPanel } from "@/features/history/components/HistoryPanel";
import { RecipientsPanel } from "@/features/recipients/components/RecipientsPanel";
import { AddressesPanel } from "@/features/addresses/components/AddressesPanel";
import { Bubbles } from "@/components/ui/Bubbles";

const STATIC_PAGES = ["/about", "/qa", "/privacy", "/terms"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStatic = STATIC_PAGES.includes(pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", overflow: "hidden" }}>
      <Bubbles />
      <Header />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", paddingTop: "4rem", overflow: "hidden" }}>
        {children}
      </div>
      {!isStatic && <CommandBar />}
      <CartPanel />
      <OrdersPanel />
      <HistoryPanel />
      <RecipientsPanel />
      <AddressesPanel />
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
