"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils/currency";
import { useCartStore } from "@/features/cart/store";
import { useProductImage } from "@/lib/hooks/useProductImage";
import { productId, productPrice } from "@/types/domain";
import type { ProductSummary } from "@/types/domain";

// AI-emitted product cards always carry image_url: null (the real thumbnail
// is fetched async by scraping the product page) — mirrors CartPanel's pattern.
function CartItemThumbnail({ product }: { product: ProductSummary }) {
  const scrapedImage = useProductImage(!product.image_url ? product.url : null);
  const imageSrc = product.image_url ?? scrapedImage;
  return imageSrc ? (
    <Image src={imageSrc} alt={product.name} fill className="object-cover" sizes="64px" />
  ) : (
    <div className="flex h-full items-center justify-center text-2xl">🎁</div>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const itemCount = useCartStore((s) => s.itemCount);
  const subtotal = useCartStore((s) => s.subtotal);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 animate-fade-up">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-(--text-primary)">Your cart is empty</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Start a conversation with Kiyo to discover products.</p>
        </div>
        <Link
          href="/"
          className="rounded-2xl bg-primary px-6 py-2.5 text-[14px] font-semibold text-white shadow-(--shadow-sm) transition-all hover:bg-(--primary-hover) active:scale-95"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 animate-fade-up">
      {/* Back */}
      <div className="mb-6 flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              aria-label="Back to chat"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-(--surface) text-muted-foreground shadow-(--shadow-xs) transition-all hover:shadow-(--shadow-sm) hover:text-(--text-primary) active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Back to chat</TooltipContent>
        </Tooltip>
        <h1 className="text-[17px] font-semibold text-(--text-primary)">Your Cart</h1>
        <span className="ml-auto text-[13px] text-muted-foreground">
          {itemCount()} item{itemCount() !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3 mb-6">
        {items.map(({ product, quantity }) => {
          const pid = productId(product);
          const price = productPrice(product);

          return (
            <div
              key={pid}
              className="flex items-center gap-4 rounded-2xl border border-border bg-(--surface) p-3 shadow-(--shadow-xs)"
            >
              {/* Image */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <CartItemThumbnail product={product} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium text-(--text-primary)">{product.name}</p>
                <p className="text-[14px] font-bold text-primary">{formatPrice(price, product.price?.currency)}</p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => updateQuantity(pid, quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Decrease quantity</TooltipContent>
                </Tooltip>
                <span className="w-6 text-center text-[13px] font-medium">{quantity}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => updateQuantity(pid, quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Increase quantity</TooltipContent>
                </Tooltip>
              </div>

              {/* Remove */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => removeItem(pid)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-red-500 active:scale-95"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove item</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-(--surface) p-4 shadow-(--shadow-sm)">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] text-muted-foreground">Subtotal</span>
          <span className="text-[17px] font-bold text-(--text-primary)">{formatPrice(subtotal(), items[0]?.product.price?.currency ?? "LKR")}</span>
        </div>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-[14px] font-semibold text-white shadow-(--shadow-sm) transition-all hover:bg-(--primary-hover) active:scale-[0.98]"
        >
          Checkout via Kiyo
        </Link>
        <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
          Tell Kiyo you&apos;re ready — she&apos;ll collect delivery details and create your order.
        </p>
      </div>
    </div>
  );
}
