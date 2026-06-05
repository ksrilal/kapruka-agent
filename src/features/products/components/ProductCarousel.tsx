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
    <div
      style={{
        marginLeft: "calc(-1 * (50vw - 50%))",
        marginRight: "calc(-1 * (50vw - 50%))",
        paddingLeft: "max(1.5rem, calc(50vw - 480px))",
        paddingRight: "max(1.5rem, calc(50vw - 480px))",
      }}
    >
      {label && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="t-title" style={{ color: "var(--ink)" }}>{label}</h2>
          <span className="t-micro" style={{ color: "var(--ink-3)" }}>{products.length} items</span>
        </div>
      )}

      {/* Wrapping grid — 4 columns, wraps into rows when > 4 products */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          paddingBottom: "4px",
        }}
      >
        {products.map((p, i) => (
          <div key={`${productId(p)}-${i}`} style={{ minWidth: 0 }}>
            <ProductCard product={p} priority={i < 4} />
          </div>
        ))}
      </div>
    </div>
  );
}
