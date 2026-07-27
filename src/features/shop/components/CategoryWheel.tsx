"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

// All 31 categories — same set as the old CategoryTicker.
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

// Fixed, evenly-spaced slots along a gentle curve on the left edge of the
// viewport — no animation, no collision risk. Scrolling the mouse wheel over
// this area cycles which categories occupy the slots.
const SLOT_COUNT = 13; // odd, so the middle slot is a single well-defined index
const SEARCH_SLOT = Math.floor(SLOT_COUNT / 2);
const SLOT_GAP = 48; // vertical distance between slot centers, px
const CURVE_MAX_PX = 20; // how far the middle slots bow toward the page — subtle

const PILL_WIDTH = 180;

function CategoryPill({ cat, onSelect }: { cat: Category; onSelect: (q: string) => void }) {
  const Icon = cat.icon;
  return (
    <button
      onClick={() => onSelect(cat.query)}
      className="wheel-pill-pop flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-lg transition-all duration-200 hover:border-(--border-2) hover:bg-(--surface-2) active:scale-95"
      style={{ width: PILL_WIDTH }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${cat.color}22` }}
      >
        <Icon className="h-2.5 w-2.5" style={{ color: cat.color }} strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0 truncate text-right text-[12px] font-medium text-muted-foreground">{cat.label}</span>
    </button>
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
      className="flex items-center gap-2 rounded-full px-3 py-1.5 w-full max-w-45 shrink-0"
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

// Category rail: fixed slots along the left edge, bowed into a shallow curve
// (middle slots sit further right than the ones near the top/bottom edges).
// Scrolling the wheel over the rail advances an offset into the category
// deck, cycling all 31 through the fixed slots — no continuous animation.
export function CategoryWheel({
  onSend,
  inputCenterY,
}: {
  onSend: (query: string) => void;
  inputCenterY: number | null;
}) {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const scrollAccum = useRef(0);

  const filtered = search.trim()
    ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(search.trim().toLowerCase()))
    : [];
  const isFiltering = search.trim().length > 0;

  // One slot (the middle one) is the fixed search box, not a category — so
  // only SLOT_COUNT - 1 categories are shown at a time.
  const visible = useMemo(
    () => Array.from({ length: SLOT_COUNT - 1 }, (_, i) => CATEGORIES[(offset + i) % CATEGORIES.length]),
    [offset]
  );

  // Each wheel "notch" (~90px of scroll delta) advances one category. Small
  // accumulator so trackpad's fine-grained deltas don't skip multiple
  // categories per gesture.
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    scrollAccum.current += e.deltaY;
    const step = 90;
    while (scrollAccum.current >= step) {
      setOffset((o) => (o + 1) % CATEGORIES.length);
      scrollAccum.current -= step;
    }
    while (scrollAccum.current <= -step) {
      setOffset((o) => (o - 1 + CATEGORIES.length) % CATEGORIES.length);
      scrollAccum.current += step;
    }
  }, []);

  const top = inputCenterY ?? "50%";
  const railHeight = SLOT_GAP * (SLOT_COUNT - 1);

  // Bow the middle slots outward, pulling back in toward the edge at the
  // top/bottom of the rail — a shallow sine curve, not a strict half-circle.
  const curveFor = (slotIdx: number) => Math.sin((slotIdx / (SLOT_COUNT - 1)) * Math.PI) * CURVE_MAX_PX;

  return (
    <div
      className="fixed left-0 hidden sm:block"
      style={{ top, transform: "translateY(-50%)", width: 260, height: railHeight }}
      onWheel={handleWheel}
    >
      <div
        className="relative h-full w-full"
        style={{ maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)" }}
      >
        {isFiltering ? (
          // While filtering, results fill outward from the search slot
          // (just above it, then just below, alternating) so they read as
          // grouped around the search box instead of stacking from the top.
          filtered.slice(0, SLOT_COUNT - 1).map((cat, i) => {
            const step = Math.floor(i / 2) + 1;
            const slotIdx = i % 2 === 0 ? SEARCH_SLOT - step : SEARCH_SLOT + step;
            return (
              <div
                key={cat.label}
                className="absolute left-0"
                style={{ top: slotIdx * SLOT_GAP, transform: `translateX(${curveFor(slotIdx)}px)` }}
              >
                <CategoryPill cat={cat} onSelect={onSend} />
              </div>
            );
          })
        ) : (
          visible.map((cat, i) => {
            const slotIdx = i >= SEARCH_SLOT ? i + 1 : i;
            return (
              <div
                key={`${cat.label}-${i}`}
                className="absolute left-0"
                style={{ top: slotIdx * SLOT_GAP, transform: `translateX(${curveFor(slotIdx)}px)` }}
              >
                <CategoryPill cat={cat} onSelect={onSend} />
              </div>
            );
          })
        )}

        {/* Search box occupies the middle slot inline with the pills, at the
            same vertical rhythm and curve offset — not off to the side. */}
        <div
          className="absolute left-0"
          style={{ top: SEARCH_SLOT * SLOT_GAP, transform: `translateX(${curveFor(SEARCH_SLOT)}px)` }}
        >
          <SearchBox search={search} onChange={setSearch} onClear={() => setSearch("")} />
        </div>
      </div>

      {isFiltering && filtered.length === 0 && (
        <p
          className="absolute left-0 text-[12px]"
          style={{ top: SEARCH_SLOT * SLOT_GAP + 40, color: "var(--ink-3)" }}
        >
          No categories match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
