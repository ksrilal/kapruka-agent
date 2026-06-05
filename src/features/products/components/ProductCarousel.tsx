"use client";

import { ProductCard } from "./ProductCard";
import { productId } from "@/types/domain";
import type { ProductSummary } from "@/types/domain";

interface Props {
  products: ProductSummary[];
  label?: string;
}

export function ProductCarousel({ products, label }: Props) {
  if (!products.length) return null;

  return (
    // Full-bleed: escape the chat column's max-width using negative margins
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="t-title" style={{ color: "var(--ink)" }}>{label}</h2>
          <span className="t-micro" style={{ color: "var(--ink-3)" }}>{products.length} items</span>
        </div>
      )}

      {/* Wrapping grid — responsive columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-1">
        {products.map((p, i) => (
          <div key={`${productId(p)}-${i}`} style={{ minWidth: 0 }}>
            <ProductCard product={p} priority={i < 4} />
          </div>
        ))}
      </div>
    </div>
  );
}
