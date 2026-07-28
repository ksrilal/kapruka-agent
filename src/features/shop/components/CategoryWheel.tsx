"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// this area cycles which categories occupy the slots. Slot count (height)
// and pill width both scale with the actual viewport so the rail always
// extends close to the footer without leaving dead space on taller or wider
// screens, instead of a fixed size tuned for one common resolution.
const RAIL_LEFT_OFFSET = 40; // shifts the whole rail in from the viewport's left edge
const SLOT_GAP = 42; // vertical distance between slot centers, px
const CURVE_MAX_PX = 50; // how far the middle slots bow toward the page — subtle
// Anchors the rail's top just below the fixed header (4rem/64px) instead of
// vertically centering on the input, which left a large empty band between
// the header and the first visible pill on common viewport heights.
const HEADER_CLEARANCE = 140;
// Clear space to leave above the fixed footer at the bottom of the rail.
// Kept small — the rail's own bottom mask-fade (see wheel-rail below)
// already reads as a soft buffer, so a large fixed clearance on top of that
// left a visually oversized dead zone on shorter viewports.
const FOOTER_CLEARANCE = 24;
// A pill's own rendered height extends past its slot's "top" position (slot
// spacing is measured top-to-top), so the rail's true bottom-most extent is
// SLOT_GAP*(slotCount-1) + PILL_HEIGHT, not just the top-to-top distance —
// this has to be subtracted from the available space too, or the last pill
// overflows past the intended footer clearance.
const PILL_HEIGHT = 32;
const MIN_SLOT_COUNT = 7;
const MIN_PILL_WIDTH = 200;
const MAX_PILL_WIDTH = 260;
// How much of the extra width beyond a baseline viewport gets handed to the
// pills — keeps them from growing all the way to fill very wide screens.
const WIDTH_GROWTH_RATIO = 0.2;
const BASELINE_VIEWPORT_WIDTH = 1440;

// Returns null until mounted on the client and the real viewport has been
// measured. The rail's whole layout (slot count, pill width, curve offsets)
// depends on window dimensions the server can't know, so rendering a guessed
// value during SSR and swapping it after mount causes a hydration mismatch —
// callers should render nothing until this resolves.
function useViewportSize() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    function measure() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return size;
}

function CategoryPill({ cat, onSelect, width }: { cat: Category; onSelect: (q: string) => void; width: number }) {
  const Icon = cat.icon;
  return (
    <button
      onClick={() => onSelect(cat.query)}
      className="wheel-pill wheel-pill-pop wheel-pill-fade-left flex items-center justify-end gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-lg transition-all duration-200 hover:border-(--border-2) hover:bg-(--surface-2) active:scale-95"
      style={{ width }}
    >
      <span className="min-w-0 truncate text-right text-[12px] font-medium text-muted-foreground">{cat.label}</span>
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${cat.color}22` }}
      >
        <Icon className="h-2.5 w-2.5" style={{ color: cat.color }} strokeWidth={2} />
      </span>
    </button>
  );
}

function SearchBox({
  search,
  onChange,
  onClear,
  width,
}: {
  search: string;
  onChange: (v: string) => void;
  onClear: () => void;
  width: number;
}) {
  return (
    <div className="wheel-search wheel-pill-fade-left flex items-center gap-2 rounded-full px-3.5 py-2 shrink-0" style={{ width }}>
      <input
        type="text"
        value={search}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search categories…"
        className="flex-1 min-w-0 bg-transparent text-right text-[12px] font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal"
        style={{ color: "var(--ink)" }}
      />
      {search ? (
        <button onClick={onClear} aria-label="Clear search" className="shrink-0">
          <X className="h-3.5 w-3.5" style={{ color: "var(--purple-light)" }} />
        </button>
      ) : (
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--purple-light)" }} />
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
}: {
  onSend: (query: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const scrollAccum = useRef(0);
  const viewportSize = useViewportSize();

  // Fill the space between the header and the footer instead of a fixed
  // slot count tuned for one screen height. Falls back to the minimum until
  // the viewport is measured (see useViewportSize) — safe because the whole
  // component renders null in that case anyway, this just keeps every hook
  // below unconditional.
  const availableHeight = viewportSize
    ? Math.max(viewportSize.height - HEADER_CLEARANCE - FOOTER_CLEARANCE - PILL_HEIGHT, SLOT_GAP * (MIN_SLOT_COUNT - 1))
    : SLOT_GAP * (MIN_SLOT_COUNT - 1);
  const rawSlotCount = Math.floor(availableHeight / SLOT_GAP) + 1;
  // Keep odd, so the middle slot is a single well-defined index — round DOWN
  // to the next odd count, never up, or the rail's footprint can exceed the
  // available space it was just computed to fit within.
  const slotCount = rawSlotCount % 2 === 0 ? rawSlotCount - 1 : rawSlotCount;
  const searchSlot = Math.floor(slotCount / 2);

  // Pills grow slightly on wider screens (more side space to use) but only
  // by a fraction of the extra width, and capped, so they don't stretch to
  // fill very wide monitors.
  const pillWidth = viewportSize
    ? Math.min(
        MAX_PILL_WIDTH,
        Math.max(MIN_PILL_WIDTH, MIN_PILL_WIDTH + (viewportSize.width - BASELINE_VIEWPORT_WIDTH) * WIDTH_GROWTH_RATIO)
      )
    : MIN_PILL_WIDTH;

  const filtered = search.trim()
    ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(search.trim().toLowerCase()))
    : [];
  const isFiltering = search.trim().length > 0;

  // One slot (the middle one) is the fixed search box, not a category — so
  // only slotCount - 1 categories are shown at a time.
  const visible = useMemo(
    () => Array.from({ length: slotCount - 1 }, (_, i) => CATEGORIES[(offset + i) % CATEGORIES.length]),
    [offset, slotCount]
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

  // Anchored just below the header instead of vertically centered on the
  // input — centering left a large empty band between the header and the
  // rail's first visible pill on common viewport heights.
  const top = HEADER_CLEARANCE;
  const railHeight = SLOT_GAP * (slotCount - 1);
  const railWidth = pillWidth + RAIL_LEFT_OFFSET + 40;

  // Bow the middle slots outward, pulling back in toward the edge at the
  // top/bottom of the rail — a shallow sine curve, not a strict half-circle.
  const curveFor = (slotIdx: number) => Math.sin((slotIdx / (slotCount - 1)) * Math.PI) * CURVE_MAX_PX;

  // Not yet mounted/measured — render nothing rather than a guessed size
  // that would then change and mismatch the server-rendered HTML. Placed
  // after all hooks above so their call order/count never changes between
  // this render and the next.
  if (!viewportSize) return null;

  return (
    <div
      className="fixed hidden sm:block"
      style={{ top, left: RAIL_LEFT_OFFSET, width: railWidth, height: railHeight }}
      onWheel={handleWheel}
    >
      <div
        className="wheel-rail relative h-full w-full"
        style={{ maskImage: "linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)" }}
      >
        {isFiltering ? (
          // While filtering, results fill outward from the search slot
          // (just above it, then just below, alternating) so they read as
          // grouped around the search box instead of stacking from the top.
          filtered.slice(0, slotCount - 1).map((cat, i) => {
            const step = Math.floor(i / 2) + 1;
            const slotIdx = i % 2 === 0 ? searchSlot - step : searchSlot + step;
            return (
              <div
                key={cat.label}
                className="absolute left-0"
                style={{ top: slotIdx * SLOT_GAP, transform: `translateX(${curveFor(slotIdx)}px)` }}
              >
                <CategoryPill cat={cat} onSelect={onSend} width={pillWidth} />
              </div>
            );
          })
        ) : (
          visible.map((cat, i) => {
            const slotIdx = i >= searchSlot ? i + 1 : i;
            return (
              <div
                key={`${cat.label}-${i}`}
                className="absolute left-0"
                style={{ top: slotIdx * SLOT_GAP, transform: `translateX(${curveFor(slotIdx)}px)` }}
              >
                <CategoryPill cat={cat} onSelect={onSend} width={pillWidth} />
              </div>
            );
          })
        )}

        {/* Search box occupies the middle slot inline with the pills, at the
            same vertical rhythm and curve offset — not off to the side. */}
        <div
          className="absolute left-0"
          style={{ top: searchSlot * SLOT_GAP, transform: `translateX(${curveFor(searchSlot)}px)` }}
        >
          <SearchBox search={search} onChange={setSearch} onClear={() => setSearch("")} width={pillWidth} />
        </div>
      </div>

      {isFiltering && filtered.length === 0 && (
        <p
          className="absolute left-0 text-[12px]"
          style={{ top: searchSlot * SLOT_GAP + 40, color: "var(--ink-3)" }}
        >
          No categories match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
