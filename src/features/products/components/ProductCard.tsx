"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, ShoppingCart, Check, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/utils/currency";
import { productPrice, productOriginalPrice, productId } from "@/types/domain";
import { useCartStore } from "@/features/cart/store";
import { useShopStore } from "@/features/shop/store";
import { useProductImage } from "@/lib/hooks/useProductImage";
import type { ProductSummary } from "@/types/domain";

function categoryEmoji(category?: string | null): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("cake")) return "🎂";
  if (c.includes("flower") || c.includes("rose")) return "🌸";
  if (c.includes("chocolate") || c.includes("candy")) return "🍫";
  if (c.includes("toy") || c.includes("kid")) return "🧸";
  if (c.includes("jewel") || c.includes("ring")) return "💍";
  if (c.includes("perfume") || c.includes("fragrance")) return "🌺";
  if (c.includes("hamper") || c.includes("basket")) return "🧺";
  if (c.includes("book")) return "📚";
  if (c.includes("cloth") || c.includes("wear")) return "👗";
  return "🎁";
}


interface Props {
  product: ProductSummary;
  priority?: boolean;
}

export function ProductCard({ product, priority }: Props) {
  const price = productPrice(product);
  const originalPrice = productOriginalPrice(product);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const imageSrc = useProductImage(product.url);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const items = useCartStore((s) => s.items);
  const inCart = items.some((i) => productId(i.product) === productId(product));

  const sendMessage = useShopStore((s) => s.sendMessage);
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close overlay when clicking outside the card
  useEffect(() => {
    if (!expanded) return;
    function onClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [expanded]);

  function handleCardClick() {
    setExpanded((v) => !v);
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    addItem(product);
    openCart();
    setJustAdded(true);
    setExpanded(false);
    setTimeout(() => setJustAdded(false), 1800);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.stopPropagation();
    if (!sendMessage) return;
    const pid = productId(product);
    const cur = product.price?.currency ?? "LKR";
    setExpanded(false);
    sendMessage(
      `I want to order 1x ${product.name} [product_id:${pid}] (${cur} ${price.toLocaleString()}). Please help me place the order.`
    );
    router.push("/");
  }

  return (
    <div ref={cardRef} className="product-card group flex flex-col" style={{ position: "relative" }}>
      {/* Clickable image area */}
      <div
        className="relative aspect-4/3 w-full overflow-hidden bg-muted shrink-0 cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
        aria-label={`Options for ${product.name}`}
        aria-expanded={expanded}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 select-none"
            style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)" }}
          >
            <span className="text-5xl">{categoryEmoji(product.category?.name)}</span>
            <span className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>Kapruka</span>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)",
            opacity: expanded ? 1 : 0,
            pointerEvents: "none",
          }}
        />

        {/* Action overlay — slides up on click */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 transition-all duration-250"
          style={{
            transform: expanded ? "translateY(0)" : "translateY(100%)",
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="flex gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Kapruka
            </a>

            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: justAdded
                  ? "var(--green)"
                  : "linear-gradient(135deg, var(--purple) 0%, var(--purple-hover) 100%)",
                boxShadow: "0 2px 10px var(--purple-glow)",
                transition: "background 0.3s",
              }}
            >
              {justAdded
                ? <><Check className="h-3.5 w-3.5" /> Added</>
                : <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>
              }
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            disabled={!product.in_stock}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--gold, #f59e0b) 0%, #d97706 100%)",
              boxShadow: "0 2px 10px rgba(245,158,11,0.35)",
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Buy Now
          </button>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ background: "var(--purple)", boxShadow: "0 2px 8px var(--purple-glow)" }}
            >
              -{discount}%
            </span>
          )}
          {!product.in_stock && (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              Out of stock
            </span>
          )}
        </div>

        {/* In-cart indicator */}
        {inCart && !expanded && (
          <div
            className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: "var(--purple)", boxShadow: "0 0 8px var(--purple-glow)" }}
          >
            <ShoppingCart className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Info — clicking here also toggles overlay */}
      <div
        className="p-3 flex flex-col flex-1 gap-2 cursor-pointer"
        onClick={handleCardClick}
      >
        {product.category && (
          <p className="t-micro text-muted-foreground">{product.category.name}</p>
        )}
        <h3 className="t-small font-semibold text-foreground line-clamp-2 leading-snug flex-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div>
            <p className="text-[15px] font-bold tracking-tight" style={{ color: "var(--purple-light)" }}>
              {formatPrice(price, product.price?.currency)}
            </p>
            {originalPrice && (
              <p className="t-micro text-muted-foreground line-through">{formatPrice(originalPrice, product.compare_at_price?.currency)}</p>
            )}
          </div>
          {/* Tap hint */}
          <span className="text-[10px] font-medium" style={{ color: "var(--ink-3)" }}>
            {expanded ? "tap to close" : "tap for options"}
          </span>
        </div>
      </div>
    </div>
  );
}
