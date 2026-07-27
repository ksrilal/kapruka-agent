"use client";

import { useMemo, useState } from "react";
import {
  Cake, Flower2, Gift, Candy, Gem, Baby, ShoppingBag, Smartphone,
  Shirt, UtensilsCrossed, Apple, Carrot, Ticket, PackageOpen, ShoppingBasket,
  PartyPopper, Gift as GiftBox, Watch, Sparkles, Wand2, ShoppingBag as HandbagIcon,
  Palette, GraduationCap, BookOpen, HeartPulse, PawPrint, Baby as BabyIcon,
  Home, Church, Car, Bike, HeartHandshake, MapPin, Search, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  icon: LucideIcon;
  label: string;
  query: string;
  color: string;
}

// All 31 categories — icons chosen to best match each, colors kept varied for
// visual richness across the ticker. First 8 (Cakes..Fashion) match the
// original desktop category set exactly.
const CATEGORIES: Category[] = [
  { icon: Cake,             label: "Cakes",                          query: "Show me birthday cakes",              color: "#f59e0b" },
  { icon: Flower2,          label: "Flowers",                        query: "Show me flowers",                     color: "#ec4899" },
  { icon: Gift,             label: "Gifts",                          query: "Show me gift hampers",                color: "#8b5cf6" },
  { icon: Candy,            label: "Chocolates",                     query: "Show me chocolates",                  color: "#ef4444" },
  { icon: Baby,             label: "Toys",                           query: "Show me toys for kids",               color: "#06b6d4" },
  { icon: Gem,              label: "Jewellery",                      query: "Show me jewellery",                   color: "#a78bfa" },
  { icon: Smartphone,       label: "Electronics",                    query: "Show me electronics",                 color: "#10b981" },
  { icon: ShoppingBag,      label: "Fashion",                        query: "Show me fashion and clothing",        color: "#f97316" },
  { icon: PackageOpen,      label: "Combo Gift Packs",                query: "Show me combo gift packs",            color: "#8b5cf6" },
  { icon: Shirt,            label: "Clothing",                       query: "Show me clothing",                    color: "#f97316" },
  { icon: UtensilsCrossed,  label: "Food & Restaurants",              query: "Show me food and restaurant options", color: "#ef4444" },
  { icon: Apple,            label: "Fruit & Fruit Baskets",           query: "Show me fruit baskets",               color: "#22c55e" },
  { icon: Carrot,           label: "Veg & Veg Baskets",               query: "Show me vegetable baskets",           color: "#f59e0b" },
  { icon: Ticket,           label: "Gift Vouchers & Tickets",         query: "Show me gift vouchers and tickets",   color: "#8b5cf6" },
  { icon: GiftBox,          label: "Combo and Gift Sets",             query: "Show me combo and gift sets",         color: "#ec4899" },
  { icon: ShoppingBasket,   label: "Grocery Items",                   query: "Show me grocery items",               color: "#10b981" },
  { icon: PartyPopper,      label: "Greeting Cards & Party",          query: "Show me greeting cards and party items", color: "#ec4899" },
  { icon: PackageOpen,      label: "Hampers",                        query: "Show me hampers",                     color: "#f59e0b" },
  { icon: Watch,            label: "Jewelry & Watches",               query: "Show me jewelry and watches",         color: "#a78bfa" },
  { icon: Sparkles,         label: "Personalized Gifts",              query: "Show me personalized gifts",          color: "#8b5cf6" },
  { icon: Wand2,            label: "Perfumes & Fragrances",           query: "Show me perfumes and fragrances",     color: "#c084fc" },
  { icon: HandbagIcon,      label: "Hand Bags & Fashion & Shoes",      query: "Show me handbags, fashion, and shoes", color: "#f97316" },
  { icon: Palette,          label: "Cosmetics",                      query: "Show me cosmetics",                   color: "#ec4899" },
  { icon: GraduationCap,    label: "College Pride",                  query: "Show me college pride items",         color: "#3b82f6" },
  { icon: BookOpen,         label: "School Supplies",                query: "Show me school supplies",             color: "#06b6d4" },
  { icon: BookOpen,         label: "Books",                          query: "Show me books",                       color: "#a78bfa" },
  { icon: HeartPulse,       label: "Health and Wellness",             query: "Show me health and wellness products", color: "#ef4444" },
  { icon: BabyIcon,         label: "Soft Toys & Kids Toys",           query: "Show me soft toys and kids toys",     color: "#06b6d4" },
  { icon: Bike,             label: "Sports & Bicycles",               query: "Show me sports items and bicycles",   color: "#10b981" },
  { icon: Baby,             label: "Mother & Baby",                  query: "Show me mother and baby products",    color: "#ec4899" },
  { icon: Home,             label: "Home & Lifestyle",                query: "Show me home and lifestyle products", color: "#f59e0b" },
  { icon: Church,           label: "Religious Items",                query: "Show me religious items",             color: "#a78bfa" },
  { icon: Car,              label: "Automobile",                     query: "Show me automobile accessories",      color: "#3b82f6" },
  { icon: PawPrint,         label: "Petcare",                        query: "Show me petcare products",            color: "#f97316" },
  { icon: HeartHandshake,   label: "Intimate Essentials",             query: "Show me intimate essentials",         color: "#ec4899" },
  { icon: MapPin,           label: "Made In SL",                     query: "Show me products made in Sri Lanka",  color: "#22c55e" },
];

function CategoryPill({ icon: Icon, label, query, color, onSelect }: Category & { onSelect: (q: string) => void }) {
  return (
    <button
      onClick={() => onSelect(query)}
      className="group flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 transition-all duration-200 hover:border-(--border-2) hover:bg-(--surface-2) active:scale-95"
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${color}22` }}
      >
        <Icon className="h-2.5 w-2.5" style={{ color }} strokeWidth={2} />
      </span>
      <span className="text-[12px] font-medium text-muted-foreground whitespace-nowrap">{label}</span>
    </button>
  );
}

// Duplicating the row's contents lets the CSS animation loop seamlessly
// (translate exactly -50% of the doubled track, then snap back unnoticed).
function TickerRow({
  categories,
  direction,
  onSelect,
}: {
  categories: Category[];
  direction: "left" | "right";
  onSelect: (q: string) => void;
}) {
  return (
    <div className="ticker-row-mask">
      <div className={`ticker-track flex w-max gap-2 ${direction === "right" ? "ticker-track-reverse" : ""}`}>
        {[...categories, ...categories].map((cat, i) => (
          <CategoryPill key={`${cat.label}-${i}`} {...cat} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SearchBox({
  search,
  onChange,
  onClear,
}: {
  search: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5 w-full max-w-55 shrink-0"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--ink-3)" }} />
      <input
        type="text"
        value={search}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search categories…"
        className="flex-1 min-w-0 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
        style={{ color: "var(--ink)" }}
      />
      {search && (
        <button onClick={onClear} aria-label="Clear search" className="shrink-0">
          <X className="h-3.5 w-3.5" style={{ color: "var(--ink-3)" }} />
        </button>
      )}
    </div>
  );
}

export function CategoryTicker({ onSelect }: { onSelect: (query: string) => void }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [search]);

  const isFiltering = search.trim().length > 0;
  const mid = Math.ceil(filtered.length / 2);
  const rowA = filtered.slice(0, mid);
  const rowB = filtered.slice(mid);
  // Row 1 splits in half again, one half scrolling on either side of the
  // fixed, centered search box that sits at row 1's vertical middle.
  const rowAMid = Math.ceil(rowA.length / 2);
  const rowALeft = rowA.slice(0, rowAMid);
  const rowARight = rowA.slice(rowAMid);

  // The search box always renders at this exact position in the tree (same
  // parent row, same slot) no matter which branch below is active — only
  // what surrounds it changes. Conditionally moving it between different
  // parent elements would remount the <input> on every layout switch (e.g.
  // typing the first filter character) and drop focus.
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {/* Row 1 — search box fixed and centered at its vertical middle. When
            not filtering, category pills scroll in two halves on either
            side of it; while filtering, those halves are simply empty. */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {!isFiltering && <TickerRow categories={rowALeft} direction="right" onSelect={onSelect} />}
          </div>
          <SearchBox search={search} onChange={setSearch} onClear={() => setSearch("")} />
          <div className="flex-1 min-w-0">
            {!isFiltering && <TickerRow categories={rowARight} direction="left" onSelect={onSelect} />}
          </div>
        </div>

        {isFiltering ? (
          filtered.length === 0 ? (
            <p className="text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
              No categories match &ldquo;{search}&rdquo;
            </p>
          ) : (
            // Filtered results are usually few — show them as a single
            // static row, centered, below the search box.
            <div className="flex flex-wrap items-center justify-center gap-2">
              {filtered.map((cat) => (
                <CategoryPill key={cat.label} {...cat} onSelect={onSelect} />
              ))}
            </div>
          )
        ) : (
          rowB.length > 0 && <TickerRow categories={rowB} direction="right" onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}
