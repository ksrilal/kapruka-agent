"use client";

import { ExternalLink, Clock, CheckCircle } from "lucide-react";
import { formatLKR } from "@/lib/utils/currency";
import type { Order } from "@/types/domain";

export function OrderCard({ order }: { order: Order }) {
  const expiresAt = new Date(order.expires_at);
  const minutesLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000));

  return (
    <div className="w-full max-w-sm rounded-(--r5) border border-border bg-card shadow-(--s3) overflow-hidden anim-scale-up">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="t-small font-semibold text-(--ink)">Order Ready</p>
          <p className="t-micro text-(--ink-3)">Ref: {order.order_ref}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 py-3 space-y-1.5">
        {([
          ["Items", order.summary.items_total],
          ["Delivery", order.summary.delivery_fee],
          ...(order.summary.addons_total > 0 ? [["Add-ons", order.summary.addons_total]] : []),
        ] as [string, number][]).map(([label, amount]) => (
          <div key={label} className="flex justify-between t-small">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-(--ink)">{formatLKR(amount)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 t-body font-semibold">
          <span className="text-(--ink)">Total</span>
          <span className="text-(--red)">{formatLKR(order.summary.grand_total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-2">
        {minutesLeft > 0 && (
          <p className="flex items-center gap-1.5 t-micro text-(--ink-3)">
            <Clock className="h-3 w-3" />
            Payment link expires in {minutesLeft} min
          </p>
        )}
        <a
          href={order.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--red) py-2.5 t-small font-semibold text-white shadow-(--s2) transition-all hover:bg-(--red-hover) active:scale-[0.98]"
        >
          Complete Payment
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
