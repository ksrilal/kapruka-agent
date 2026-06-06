"use client";

import { Sparkles, X } from "lucide-react";
import { useShopStore } from "@/features/shop/store";

export function ResultsHeader() {
  const lastAiText = useShopStore((s) => s.lastAiText);
  const setFeaturedProducts = useShopStore((s) => s.setFeaturedProducts);
  const setLastAiText = useShopStore((s) => s.setLastAiText);

  if (!lastAiText) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-(--border) bg-card px-4 py-3 shadow-(--s1) anim-fade-in">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl mt-0.5" style={{ background: "var(--purple-soft)", border: "1px solid var(--border-2)" }}>
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <p className="t-small text-(--ink) flex-1 leading-relaxed">{lastAiText}</p>
      <button
        onClick={() => { setFeaturedProducts([]); setLastAiText(""); }}
        className="shrink-0 text-(--ink-3) hover:text-(--ink-2) transition-colors mt-0.5"
        aria-label="Clear results"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
