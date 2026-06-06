"use client";

import { useEffect, useRef } from "react";
import { useOrdersStore, isTerminal } from "@/features/orders/store";
import type { OrderStatus } from "@/types/domain";

const POLL_INTERVAL_MS = 60_000; // 1 minute

async function fetchOrderStatus(orderNumber: string): Promise<OrderStatus | null> {
  try {
    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_number: orderNumber }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { status?: OrderStatus };
    return data.status ?? null;
  } catch {
    return null;
  }
}

export function useOrderPolling() {
  const tracked = useOrdersStore((s) => s.tracked);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeCount = tracked.filter((t) => !isTerminal(t.status.status)).length;

  useEffect(() => {
    if (activeCount === 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    async function pollAll() {
      // Read fresh state directly from the store to avoid stale closure
      const { tracked: current, updateTracking, stampPolled } = useOrdersStore.getState();
      const now = Date.now();
      for (const saved of current) {
        if (isTerminal(saved.status.status)) continue;
        // Skip if polled recently (55s gap avoids double-fire on mount + interval)
        if (saved.lastPolledAt && now - saved.lastPolledAt < 55_000) continue;
        // Stamp before fetch so a slow request doesn't trigger a second concurrent poll
        stampPolled(saved.status.order_number, now);
        const status = await fetchOrderStatus(saved.status.order_number);
        if (status) updateTracking(saved.status.order_number, status);
      }
    }

    void pollAll();
    timerRef.current = setInterval(() => { void pollAll(); }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [activeCount]);
}
