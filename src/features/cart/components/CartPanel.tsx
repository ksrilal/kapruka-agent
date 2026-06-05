"use client";

import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useShopStore } from "@/features/shop/store";
import { productId, productPrice } from "@/types/domain";
import { formatLKR } from "@/lib/utils/currency";

export function CartPanel() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const itemCount = useCartStore((s) => s.itemCount);
  const subtotal = useCartStore((s) => s.subtotal);
  const focusSearch = useShopStore((s) => s.focusSearch);
  const sendMessage = useShopStore((s) => s.sendMessage);

  if (!isOpen) return null;

  const count = itemCount();
  const total = subtotal();

  function handleCheckout() {
    if (!sendMessage) return;
    const itemList = items
      .map((i) => `${i.quantity}x ${i.product.name} (LKR ${productPrice(i.product).toLocaleString()})`)
      .join(", ");
    close();
    sendMessage(
      `I want to checkout. My cart has: ${itemList}. Total: LKR ${total.toLocaleString()}. Please help me place the order.`
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="backdrop"
        onClick={close}
        style={{ zIndex: 70 }}
      />

      {/* Panel */}
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
            <h2 className="t-title" style={{ color: "var(--ink)" }}>Your Cart</h2>
            {count > 0 && (
              <p className="t-small mt-0.5" style={{ color: "var(--ink-2)" }}>
                {count} item{count !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-2)" }}
              >
                <ShoppingBag className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>Cart is empty</p>
                <p className="t-small mt-1" style={{ color: "var(--ink-2)" }}>
                  Ask Kiyo to find something special.
                </p>
              </div>
              <button
                onClick={() => { close(); focusSearch(); }}
                className="btn-purple flex items-center gap-1.5 px-5 py-2 t-small font-semibold"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map(({ product, quantity }) => {
                const pid = productId(product);
                const price = productPrice(product);
                const isCake = product.category?.name?.toLowerCase().includes("cake");

                return (
                  <div
                    key={pid}
                    className="group flex gap-3 rounded-2xl p-3 transition-shadow anim-fade-in"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                      style={{ background: "var(--surface-2)" }}
                    >
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          {isCake ? "🎂" : "🎁"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="t-small font-medium line-clamp-2 leading-snug" style={{ color: "var(--ink)" }}>
                        {product.name}
                      </p>
                      <p className="mt-1 text-[14px] font-bold" style={{ color: "var(--purple-light)" }}>
                        {formatLKR(price * quantity)}
                      </p>

                      {/* Icing text for cakes */}
                      {isCake && (
                        <input
                          type="text"
                          placeholder="Cake message (optional)"
                          maxLength={40}
                          className="mt-2 w-full rounded-lg px-2 py-1 text-[11px] outline-none"
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--ink)",
                          }}
                          onChange={(e) => useCartStore.getState().updateIcing(pid, e.target.value)}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(pid)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: "var(--ink-3)" }}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(pid, quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors active:scale-95"
                          style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(pid, quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors active:scale-95"
                          style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-6 py-5 space-y-4"
            style={{ borderTop: "1px solid var(--border-2)" }}
          >
            <div className="flex items-baseline justify-between">
              <span className="t-small" style={{ color: "var(--ink-2)" }}>Subtotal</span>
              <span className="text-[20px] font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                {formatLKR(total)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-purple flex w-full items-center justify-center gap-2 py-3.5 text-[14px] font-semibold rounded-2xl"
            >
              <Sparkles className="h-4 w-4" />
              Checkout with Kiyo
            </button>
            <p className="text-center t-micro" style={{ color: "var(--ink-3)" }}>
              Kiyo will guide you through delivery & payment
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
