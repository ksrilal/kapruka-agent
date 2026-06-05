"use client";

import { Package2, MapPin, Calendar } from "lucide-react";
import type { OrderStatus } from "@/types/domain";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  delivered:  { bg: "bg-green-100",  text: "text-green-700",  label: "Delivered" },
  shipped:    { bg: "bg-blue-100",   text: "text-blue-700",   label: "Shipped" },
  processing: { bg: "bg-amber-100",  text: "text-amber-700",  label: "Processing" },
  cancelled:  { bg: "bg-red-100",    text: "text-red-700",    label: "Cancelled" },
};

export function OrderStatusCard({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status.status] ?? {
    bg: "bg-(--bg-2)", text: "text-(--ink-2)", label: status.status_display,
  };

  return (
    <div className="w-full max-w-sm rounded-(--r5) border border-border bg-card shadow-(--s3) overflow-hidden anim-scale-up">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--red-soft)">
          <Package2 className="h-4 w-4 text-(--red)" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="t-small font-semibold text-(--ink) truncate">
            Order {status.order_number}
          </p>
          <span className={`inline-block rounded-full px-2 py-0.5 t-micro font-semibold ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 t-small text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Delivery: <span className="font-medium text-(--ink)">{status.delivery_date}</span></span>
        </div>
        {status.recipient.city && (
          <div className="flex items-center gap-2 t-small text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {status.recipient.name},{" "}
              <span className="font-medium text-(--ink)">{status.recipient.city}</span>
            </span>
          </div>
        )}
      </div>

      {/* Progress timeline */}
      {status.progress.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="t-micro text-(--ink-3) mb-2">Progress</p>
          <ol className="flex flex-col gap-2">
            {status.progress.map((step, i) => {
              const isLast = i === status.progress.length - 1;
              return (
                <li key={i} className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${isLast ? "bg-(--red)" : "bg-(--border-2)"}`} />
                  <span className={`t-micro ${isLast ? "font-medium text-(--ink)" : "text-(--ink-3)"}`}>
                    {step.step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
