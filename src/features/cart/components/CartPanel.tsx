"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Trash2, ShoppingBag, Sparkles, ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCartStore } from "@/features/cart/store";
import { useShopStore } from "@/features/shop/store";
import { productId, productPrice } from "@/types/domain";
import { formatPrice } from "@/lib/utils/currency";
import { useProductImage } from "@/lib/hooks/useProductImage";
import type { CartLineItem } from "@/features/cart/store";

// ─── CartItemRow ──────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  multiItem,
  onRemove,
  onUpdateQty,
  onCheckoutThis,
}: {
  item: CartLineItem;
  multiItem: boolean;
  onRemove: (pid: string) => void;
  onUpdateQty: (pid: string, qty: number) => void;
  onCheckoutThis: (pid: string) => void;
}) {
  const { product, quantity } = item;
  const pid = productId(product);
  const price = productPrice(product);
  const isCake = product.category?.name?.toLowerCase().includes("cake");

  // Prefer MCP image_url; fall back to scraping the product page
  const scrapedImage = useProductImage(!product.image_url ? product.url : null);
  const imageSrc = product.image_url ?? scrapedImage;

  return (
    <div
      className="group flex gap-3 rounded-2xl p-3 transition-shadow anim-fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Thumbnail — taller to show more of the image */}
      <div
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"
        style={{ background: "var(--surface-2)" }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl select-none">
            {isCake ? "🎂" : "🎁"}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-[13px] font-medium line-clamp-2 leading-snug" style={{ color: "var(--ink)" }}>
            {product.name}
          </p>
          <p className="mt-1 text-[15px] font-bold" style={{ color: "var(--purple-light)" }}>
            {formatPrice(price * quantity, product.price?.currency)}
          </p>
        </div>

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

      <div className="flex flex-col items-end justify-between py-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onRemove(pid)}
              className="opacity-70 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              style={{ color: "var(--ink-3)" }}
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove item</TooltipContent>
        </Tooltip>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUpdateQty(pid, quantity - 1)}
                  aria-label="Decrease quantity"
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <Minus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Decrease quantity</TooltipContent>
            </Tooltip>
            <span className="w-5 text-center text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              {quantity}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUpdateQty(pid, quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Increase quantity</TooltipContent>
            </Tooltip>
          </div>

          {multiItem && (
            <button
              onClick={() => onCheckoutThis(pid)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all active:scale-95"
              style={{ background: "var(--purple-soft)", color: "var(--purple-light)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <ShoppingCart className="h-2.5 w-2.5" />
              Order this
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CartPanel ────────────────────────────────────────────────────────────────

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
  const router = useRouter();

  if (!isOpen) return null;

  const count = itemCount();
  const total = subtotal();
  const cartCurrency = items[0]?.product.price?.currency ?? "LKR";

  function handleCheckout() {
    if (!sendMessage) return;
    const itemList = items
      .map((i) => `${i.quantity}x ${i.product.name} [product_id:${productId(i.product)}] (${cartCurrency} ${productPrice(i.product).toLocaleString()})`)
      .join(", ");
    close();
    // Don't clear the cart here — sendMessage is fire-and-forget and the AI
    // hasn't actually placed the order yet (it may fail, ask clarifying
    // questions, or the user may change their mind). Clearing now would lose
    // the user's selections on a checkout that never completed.
    sendMessage(
      `I want to checkout. My cart has: ${itemList}. Total: ${cartCurrency} ${total.toLocaleString()}. Please help me place the order.`
    );
    // Checkout always plays out in the chat — navigate home so the user sees
    // Kiyo respond, even when triggered from a static page (About, Q&A, etc.)
    router.push("/");
  }

  function handleCheckoutItem(pid: string) {
    if (!sendMessage) return;
    const line = items.find((i) => productId(i.product) === pid);
    if (!line) return;
    const price = productPrice(line.product);
    const cur = line.product.price?.currency ?? "LKR";
    close();
    // Don't remove the item here — see handleCheckout: the order isn't
    // confirmed yet, just requested. Removing now risks losing it if the
    // AI flow doesn't complete.
    sendMessage(
      `I want to order ${line.quantity}x ${line.product.name} [product_id:${pid}] (${cur} ${(price * line.quantity).toLocaleString()}). Please help me place the order.`
    );
    router.push("/");
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={close}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-foreground active:scale-95"
                style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
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
                onClick={() => { close(); router.push("/"); focusSearch(); }}
                className="btn-purple flex items-center gap-1.5 px-5 py-2 t-small font-semibold"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow
                  key={productId(item.product)}
                  item={item}
                  multiItem={items.length > 1}
                  onRemove={removeItem}
                  onUpdateQty={updateQuantity}
                  onCheckoutThis={handleCheckoutItem}
                />
              ))}
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
                {formatPrice(total, cartCurrency)}
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
