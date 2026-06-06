"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X, Package, ExternalLink, Clock, Trash2, RefreshCw, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useOrdersStore, isTerminal } from "@/features/orders/store";
import { useOrderPolling } from "@/features/orders/hooks/useOrderPolling";
import type { SavedOrder, SavedTracking } from "@/features/orders/store";
import type { OrderStatus } from "@/types/domain";

// ─── helpers ──────────────────────────────────────────────────────────────────

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
  if (status === "shipped") return "#3b82f6";
  return "var(--purple-light)";
}

function StatusBadge({ status, display }: { status: string; display: string }) {
  const color = statusColor(status);
  const terminal = isTerminal(status);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {terminal && status === "delivered" && <CheckCircle2 className="h-3 w-3" />}
      {terminal && status === "cancelled" && <XCircle className="h-3 w-3" />}
      {display}
    </span>
  );
}

// ─── PendingOrderRow ──────────────────────────────────────────────────────────

function PendingOrderRow({ saved, onRemove }: { saved: SavedOrder; onRemove: () => void }) {
  const { order, itemNames } = saved;
  const expired = new Date(order.expires_at).getTime() <= Date.now();

  const [showPaidInput, setShowPaidInput] = useState(false);
  const [orderNum, setOrderNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promotePendingToTracked = useOrdersStore((s) => s.promotePendingToTracked);

  async function handleConfirmPayment() {
    const num = orderNum.trim();
    if (!num) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: num }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Order not found. Check the number from your confirmation email.");
        return;
      }
      const data = await res.json() as { status: OrderStatus };
      promotePendingToTracked(order.order_ref, data.status);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="group rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "var(--surface)",
        border: `1px solid ${expired ? "rgba(239,68,68,0.3)" : "var(--border-2)"}`,
        opacity: expired ? 0.6 : 1,
      }}
    >
      {/* Top row: image + name + delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
            {saved.imageUrl ? (
              <Image
                src={saved.imageUrl}
                alt={itemNames[0] ?? "Order item"}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-5 w-5" style={{ color: "var(--purple-light)" }} />
              </div>
            )}
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

      {/* Amount + Pay Now / expiry */}
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

      {/* "I've paid" section */}
      {!showPaidInput ? (
        <button
          onClick={() => setShowPaidInput(true)}
          className="text-[11px] font-medium underline-offset-2 hover:underline transition-colors text-left"
          style={{ color: "var(--purple-light)" }}
        >
          Already paid? Enter your order number →
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[11px]" style={{ color: "var(--ink-2)" }}>
            Enter the order number from your confirmation email (e.g. VIMP34456CB2):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleConfirmPayment(); }}
              placeholder="e.g. VIMP34456CB2"
              className="flex-1 min-w-0 rounded-xl px-3 py-2 text-[12px] outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-2)",
                color: "var(--ink)",
              }}
              autoFocus
              disabled={loading}
            />
            <button
              onClick={() => void handleConfirmPayment()}
              disabled={loading || !orderNum.trim()}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--purple)" }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Track"}
            </button>
          </div>
          {error && <p className="text-[11px]" style={{ color: "var(--destructive)" }}>{error}</p>}
          <button
            onClick={() => { setShowPaidInput(false); setError(null); setOrderNum(""); }}
            className="text-[11px] text-left"
            style={{ color: "var(--ink-3)" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TrackingRow ──────────────────────────────────────────────────────────────

function TrackingRow({ saved, onRemove }: { saved: SavedTracking; onRemove: () => void }) {
  const { status } = saved;
  const color = statusColor(status.status);
  const terminal = isTerminal(status.status);
  const updateTracking = useOrdersStore((s) => s.updateTracking);

  const [refreshing, setRefreshing] = useState(false);

  async function handleManualRefresh() {
    if (refreshing || terminal) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: status.order_number }),
      });
      if (res.ok) {
        const data = await res.json() as { status: OrderStatus };
        updateTracking(status.order_number, data.status);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div
      className="group rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "var(--surface)",
        border: `1px solid ${terminal ? `${color}30` : "var(--border-2)"}`,
      }}
    >
      {/* Header */}
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
            <StatusBadge status={status.status} display={status.status_display} />
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!terminal && (
            <button
              onClick={() => void handleManualRefresh()}
              disabled={refreshing}
              style={{ color: "var(--ink-3)" }}
              aria-label="Refresh tracking"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          <button onClick={onRemove} style={{ color: "var(--ink-3)" }} aria-label="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Details grid */}
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

      {/* Progress timeline */}
      {status.progress.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
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

      {/* Live poll indicator — only for non-terminal */}
      {!terminal && (
        <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
          Auto-updates every minute · Last updated{" "}
          {saved.lastPolledAt
            ? new Date(saved.lastPolledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "never"}
        </p>
      )}
    </div>
  );
}

// ─── OrdersPanel ──────────────────────────────────────────────────────────────

// Inner component — only mounted when the panel is open, so hooks (polling,
// pruning) only run while the user has the panel visible.
function OrdersPanelContent({ onClose }: { onClose: () => void }) {
  const pending = useOrdersStore((s) => s.pending);
  const tracked = useOrdersStore((s) => s.tracked);
  const removePending = useOrdersStore((s) => s.removePending);
  const removeTracking = useOrdersStore((s) => s.removeTracking);
  const pruneExpired = useOrdersStore((s) => s.pruneExpired);

  // Polling only runs while this component is mounted (panel open)
  useOrderPolling();

  useEffect(() => {
    pruneExpired();
  }, [pruneExpired]);

  const totalCount = pending.length + tracked.length;

  return (
    <>
      <div className="backdrop" onClick={onClose} style={{ zIndex: 70 }} />

      <aside className="cart-panel glass-dark anim-slide-left flex flex-col" style={{ zIndex: 80 }}>
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
            onClick={onClose}
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
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function OrdersPanel() {
  const isOpen = useOrdersStore((s) => s.isOpen);
  const close = useOrdersStore((s) => s.close);
  if (!isOpen) return null;
  return <OrdersPanelContent onClose={close} />;
}
