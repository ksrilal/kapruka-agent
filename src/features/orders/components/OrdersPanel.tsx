"use client";

import { useEffect } from "react";
import { X, Package, ExternalLink, Clock, Trash2, RefreshCw } from "lucide-react";
import { useOrdersStore } from "@/features/orders/store";
import { useShopStore } from "@/features/shop/store";
import type { SavedOrder, SavedTracking } from "@/features/orders/store";

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "< 1 min left";
  return `${mins} min left`;
}

function statusColor(status: string): string {
  if (status === "delivered") return "var(--green)";
  if (status === "cancelled") return "var(--destructive)";
  return "var(--purple-light)";
}

function PendingOrderRow({ saved, onRemove }: { saved: SavedOrder; onRemove: () => void }) {
  const { order, itemNames } = saved;
  const expired = new Date(order.expires_at).getTime() <= Date.now();

  return (
    <div
      className="group rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "var(--surface)",
        border: `1px solid ${expired ? "rgba(239,68,68,0.3)" : "var(--border-2)"}`,
        opacity: expired ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--purple-soft)" }}
          >
            <Package className="h-3.5 w-3.5" style={{ color: "var(--purple-light)" }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
              {order.order_ref}
            </p>
            {itemNames.length > 0 && (
              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--ink-3)" }}>
                {itemNames.join(", ")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--ink-3)" }}
          aria-label="Remove order"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-[16px] font-bold" style={{ color: "var(--gold)" }}>
            {order.summary.currency} {order.summary.grand_total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: expired ? "var(--destructive)" : "var(--ink-3)" }}>
            <Clock className="h-3 w-3" />
            <span>{timeLeft(order.expires_at)}</span>
          </div>
        </div>

        {!expired && (
          <a
            href={order.checkout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--purple) 0%, var(--purple-hover) 100%)",
              boxShadow: "0 3px 12px var(--purple-glow)",
            }}
          >
            Pay Now <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function TrackingRow({ saved, onRemove, onRetrack }: { saved: SavedTracking; onRemove: () => void; onRetrack: () => void }) {
  const { status } = saved;
  const color = statusColor(status.status);

  return (
    <div
      className="group rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border-2)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--purple-soft)" }}
          >
            <Package className="h-3.5 w-3.5" style={{ color: "var(--purple-light)" }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
              #{status.order_number}
            </p>
            <p className="text-[11px] font-medium" style={{ color }}>
              {status.status_display}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onRetrack} style={{ color: "var(--ink-3)" }} aria-label="Refresh tracking">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRemove} style={{ color: "var(--ink-3)" }} aria-label="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <span style={{ color: "var(--ink-3)" }}>Recipient</span>
        <span style={{ color: "var(--ink)" }}>{status.recipient.name}</span>
        <span style={{ color: "var(--ink-3)" }}>City</span>
        <span style={{ color: "var(--ink)" }}>{status.recipient.city}</span>
        <span style={{ color: "var(--ink-3)" }}>Delivery</span>
        <span style={{ color: "var(--ink)" }}>{status.delivery_date}</span>
        <span style={{ color: "var(--ink-3)" }}>Amount</span>
        <span style={{ color: "var(--gold)" }}>LKR {status.amount}</span>
      </div>

      {status.progress.length > 0 && (
        <div
          className="flex flex-col gap-1.5 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {status.progress.slice(-3).map((step, i, arr) => (
            <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--ink-2)" }}>
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: 6, height: 6, marginTop: 3,
                  background: i === arr.length - 1 ? color : "var(--border-2)",
                }}
              />
              {step.step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrdersPanel() {
  const isOpen = useOrdersStore((s) => s.isOpen);
  const close = useOrdersStore((s) => s.close);
  const pending = useOrdersStore((s) => s.pending);
  const tracked = useOrdersStore((s) => s.tracked);
  const removePending = useOrdersStore((s) => s.removePending);
  const removeTracking = useOrdersStore((s) => s.removeTracking);
  const pruneExpired = useOrdersStore((s) => s.pruneExpired);
  const sendMessage = useShopStore((s) => s.sendMessage);

  // Prune expired orders whenever panel opens — must be in useEffect, not render body
  useEffect(() => {
    if (isOpen) pruneExpired();
  }, [isOpen, pruneExpired]);

  if (!isOpen) return null;

  const totalCount = pending.length + tracked.length;

  function handleRetrack(orderNumber: string) {
    close();
    sendMessage?.(`Track my order ${orderNumber}`);
  }

  return (
    <>
      <div className="backdrop" onClick={close} style={{ zIndex: 70 }} />

      <aside
        className="cart-panel glass-dark anim-slide-left flex flex-col"
        style={{ zIndex: 80 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <div>
            <h2 className="t-title" style={{ color: "var(--ink)" }}>My Orders</h2>
            <p className="t-small mt-0.5" style={{ color: "var(--ink-2)" }}>
              {totalCount === 0 ? "No saved orders" : `${totalCount} order${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar flex flex-col gap-6">
          {totalCount === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-2)" }}
              >
                <Package className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>No orders yet</p>
                <p className="t-small mt-1" style={{ color: "var(--ink-2)" }}>
                  Orders you place will appear here — even after a page refresh.
                </p>
              </div>
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="t-micro" style={{ color: "var(--ink-3)" }}>PENDING PAYMENT</p>
              {pending.map((saved) => (
                <PendingOrderRow
                  key={saved.order.order_ref}
                  saved={saved}
                  onRemove={() => removePending(saved.order.order_ref)}
                />
              ))}
            </div>
          )}

          {tracked.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="t-micro" style={{ color: "var(--ink-3)" }}>TRACKED ORDERS</p>
              {tracked.map((saved) => (
                <TrackingRow
                  key={saved.status.order_number}
                  saved={saved}
                  onRemove={() => removeTracking(saved.status.order_number)}
                  onRetrack={() => handleRetrack(saved.status.order_number)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
