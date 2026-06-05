"use client";

import { ProductCard } from "./ProductCard";
import type { ProductSummary } from "@/types/domain";
import { productId } from "@/types/domain";

interface Props {
  products: ProductSummary[];
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, columns = 3 }: Props) {
  const gridClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={`grid w-full ${gridClass} gap-5`}>
      {products.map((p, i) => (
        <ProductCard key={productId(p)} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-(--r5) border border-border bg-card"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="aspect-4/3 w-full shimmer" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-16 rounded shimmer" />
            <div className="h-4 w-full rounded shimmer" />
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-5 w-24 rounded shimmer" />
              <div className="h-9 w-9 rounded-xl shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
