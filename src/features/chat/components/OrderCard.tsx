"use client";

import { ExternalLink, Package, Clock } from "lucide-react";
import type { Order, OrderStatus } from "@/types/domain";

export function OrderCard({ order }: { order: Order }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 max-w-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--purple-soft)", border: "1px solid var(--border-2)" }}
        >
          <Package className="h-4 w-4" style={{ color: "var(--purple-light)" }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Order Created</p>
          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>Ref: {order.order_ref}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-2)" }}>
        <Clock className="h-3 w-3" />
        <span>Expires {new Date(order.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>Total</p>
          <p className="text-[15px] font-bold" style={{ color: "var(--gold)" }}>
            {order.summary.currency} {order.summary.grand_total.toLocaleString()}
          </p>
        </div>
        <a
          href={order.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--purple) 0%, var(--purple-hover) 100%)", boxShadow: "0 4px 16px var(--purple-glow)" }}
        >
          Pay Now <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export function OrderStatusCard({ status }: { status: OrderStatus }) {
  const statusColor =
    status.status === "delivered" ? "var(--green)" :
    status.status === "cancelled" ? "var(--destructive)" :
    "var(--purple-light)";

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 max-w-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--purple-soft)", border: "1px solid var(--border-2)" }}
        >
          <Package className="h-4 w-4" style={{ color: "var(--purple-light)" }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Order #{status.order_number}</p>
          <p className="text-[11px] font-semibold" style={{ color: statusColor }}>
            {status.status_display}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[12px]" style={{ color: "var(--ink-2)" }}>
        <div className="flex justify-between">
          <span>Recipient</span>
          <span style={{ color: "var(--ink)" }}>{status.recipient.name}</span>
        </div>
        <div className="flex justify-between">
          <span>City</span>
          <span style={{ color: "var(--ink)" }}>{status.recipient.city}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery date</span>
          <span style={{ color: "var(--ink)" }}>{status.delivery_date}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount</span>
          <span style={{ color: "var(--gold)" }}>LKR {status.amount}</span>
        </div>
      </div>

      {status.progress.length > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
          {status.progress.slice(-3).map((step, i, arr) => (
            <div key={step.timestamp || step.step} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--ink-2)" }}>
              <span
                className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: i === arr.length - 1 ? statusColor : "var(--border-2)", marginTop: "4px" }}
              />
              <span>{step.step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
