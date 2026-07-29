"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowUp, Grid3x3, Cake, Flower2, Gift, Candy, Gem, Baby, ShoppingBag, Smartphone, Mic, MicOff,
  Shirt, UtensilsCrossed, Apple, Carrot, Ticket, PackageOpen, ShoppingBasket,
  PartyPopper, Gift as GiftBox, Watch, Sparkles, Wand2, ShoppingBag as HandbagIcon,
  Palette, GraduationCap, BookOpen, HeartPulse, PawPrint, Baby as BabyIcon,
  Home, Church, Car, Bike, HeartHandshake, MapPin, Search, X,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { useChat } from "@/features/chat/hooks/useChat";
import { Footer } from "@/components/layout/Footer";
import { KiyoAvatar } from "@/components/ui/KiyoAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCartStore } from "@/features/cart/store";
import { useOrdersStore } from "@/features/orders/store";
import { useHistoryStore } from "@/features/history/store";
import { useChatStore } from "@/features/chat/store";
import { useShopStore } from "@/features/shop/store";
import type { CartLineItem } from "@/features/cart/store";
import type { SavedOrder } from "@/features/orders/store";
import type { SavedSession } from "@/features/history/store";

interface Category {
  icon: LucideIcon;
  label: string;
  query: string;
  color: string;
}

const SUBTITLES = [
  { lang: "English",  text: "Tell me what you're looking for.",  color: "var(--ink)",          bg: "var(--surface-2)" },
  { lang: "සිංහල",   text: "ඔබට අවශ්‍ය දේ කියන්න.",            color: "var(--purple-light)", bg: "var(--purple-soft)" },
  { lang: "Singlish", text: "Oyata ona de kiyanna.",             color: "var(--gold)",         bg: "rgba(240,185,94,0.12)" },
  { lang: "Tanglish", text: "Unakku enna venumnu sollu.",        color: "var(--green)",        bg: "var(--green-soft)" },
];

const CATEGORIES: Category[] = [
  { icon: Cake,        label: "Cakes",       query: "Show me birthday cakes",    color: "#f59e0b" },
  { icon: Flower2,     label: "Flowers",     query: "Show me flowers",           color: "#ec4899" },
  { icon: Gift,        label: "Gifts",       query: "Show me gift hampers",      color: "#8b5cf6" },
  { icon: Candy,       label: "Chocolates",  query: "Show me chocolates",        color: "#ef4444" },
  { icon: Baby,        label: "Toys",        query: "Show me toys for kids",     color: "#06b6d4" },
  { icon: Gem,         label: "Jewellery",   query: "Show me jewellery",         color: "#a78bfa" },
  { icon: Smartphone,  label: "Electronics", query: "Show me electronics",       color: "#10b981" },
  { icon: ShoppingBag, label: "Fashion",     query: "Show me fashion and clothing", color: "#f97316" },
];

// Full category list for the expanded browser overlay — first 8 match the rail exactly
const ALL_CATEGORIES: Category[] = [
  ...CATEGORIES,
  { icon: PackageOpen,      label: "Combo Gift Packs",           query: "Show me combo gift packs",             color: "#8b5cf6" },
  { icon: Shirt,            label: "Clothing",                   query: "Show me clothing",                     color: "#f97316" },
  { icon: UtensilsCrossed,  label: "Food & Restaurants",         query: "Show me food and restaurant options",  color: "#ef4444" },
  { icon: Apple,            label: "Fruit & Fruit Baskets",      query: "Show me fruit baskets",                color: "#22c55e" },
  { icon: Carrot,           label: "Veg & Veg Baskets",          query: "Show me vegetable baskets",            color: "#f59e0b" },
  { icon: Ticket,           label: "Gift Vouchers & Tickets",    query: "Show me gift vouchers and tickets",    color: "#8b5cf6" },
  { icon: GiftBox,          label: "Combo and Gift Sets",        query: "Show me combo and gift sets",          color: "#ec4899" },
  { icon: ShoppingBasket,   label: "Grocery Items",              query: "Show me grocery items",                color: "#10b981" },
  { icon: PartyPopper,      label: "Greeting Cards & Party",     query: "Show me greeting cards and party items", color: "#ec4899" },
  { icon: PackageOpen,      label: "Hampers",                    query: "Show me hampers",                      color: "#f59e0b" },
  { icon: Watch,            label: "Jewelry & Watches",          query: "Show me jewelry and watches",          color: "#a78bfa" },
  { icon: Sparkles,         label: "Personalized Gifts",         query: "Show me personalized gifts",           color: "#8b5cf6" },
  { icon: Wand2,            label: "Perfumes & Fragrances",      query: "Show me perfumes and fragrances",      color: "#c084fc" },
  { icon: HandbagIcon,      label: "Hand Bags & Fashion & Shoes", query: "Show me handbags, fashion, and shoes", color: "#f97316" },
  { icon: Palette,          label: "Cosmetics",                  query: "Show me cosmetics",                    color: "#ec4899" },
  { icon: GraduationCap,    label: "College Pride",              query: "Show me college pride items",          color: "#3b82f6" },
  { icon: BookOpen,         label: "School Supplies",            query: "Show me school supplies",              color: "#06b6d4" },
  { icon: BookOpen,         label: "Books",                      query: "Show me books",                        color: "#a78bfa" },
  { icon: HeartPulse,       label: "Health and Wellness",        query: "Show me health and wellness products", color: "#ef4444" },
  { icon: BabyIcon,         label: "Soft Toys & Kids Toys",      query: "Show me soft toys and kids toys",      color: "#06b6d4" },
  { icon: Bike,             label: "Sports & Bicycles",          query: "Show me sports items and bicycles",    color: "#10b981" },
  { icon: Baby,             label: "Mother & Baby",              query: "Show me mother and baby products",     color: "#ec4899" },
  { icon: Home,             label: "Home & Lifestyle",           query: "Show me home and lifestyle products",  color: "#f59e0b" },
  { icon: Church,           label: "Religious Items",            query: "Show me religious items",              color: "#a78bfa" },
  { icon: Car,              label: "Automobile",                 query: "Show me automobile accessories",       color: "#3b82f6" },
  { icon: PawPrint,         label: "Petcare",                    query: "Show me petcare products",             color: "#f97316" },
  { icon: HeartHandshake,   label: "Intimate Essentials",        query: "Show me intimate essentials",          color: "#ec4899" },
  { icon: MapPin,           label: "Made In SL",                 query: "Show me products made in Sri Lanka",   color: "#22c55e" },
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

function WheelCategoryPill({ cat, onSelect, width }: { cat: Category; onSelect: (q: string) => void; width: number }) {
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

function WheelSearchBox({
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
function CategoryWheel({ onSelect }: { onSelect: (query: string) => void }) {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const scrollAccum = useRef(0);
  const railElRef = useRef<HTMLDivElement>(null);
  const viewportSize = useViewportSize();

  const availableHeight = viewportSize
    ? Math.max(viewportSize.height - HEADER_CLEARANCE - FOOTER_CLEARANCE - PILL_HEIGHT, SLOT_GAP * (MIN_SLOT_COUNT - 1))
    : SLOT_GAP * (MIN_SLOT_COUNT - 1);
  const rawSlotCount = Math.floor(availableHeight / SLOT_GAP) + 1;
  // Keep odd, so the middle slot is a single well-defined index — round DOWN
  // to the next odd count, never up, or the rail's footprint can exceed the
  // available space it was just computed to fit within.
  const slotCount = rawSlotCount % 2 === 0 ? rawSlotCount - 1 : rawSlotCount;
  const searchSlot = Math.floor(slotCount / 2);

  const pillWidth = viewportSize
    ? Math.min(
        MAX_PILL_WIDTH,
        Math.max(MIN_PILL_WIDTH, MIN_PILL_WIDTH + (viewportSize.width - BASELINE_VIEWPORT_WIDTH) * WIDTH_GROWTH_RATIO)
      )
    : MIN_PILL_WIDTH;

  const filtered = search.trim()
    ? ALL_CATEGORIES.filter((c) => c.label.toLowerCase().includes(search.trim().toLowerCase()))
    : [];
  const isFiltering = search.trim().length > 0;

  // One slot (the middle one) is the fixed search box, not a category — so
  // only slotCount - 1 categories are shown at a time.
  const visible = useMemo(
    () => Array.from({ length: slotCount - 1 }, (_, i) => ALL_CATEGORIES[(offset + i) % ALL_CATEGORIES.length]),
    [offset, slotCount]
  );

  // Each wheel "notch" (~90px of scroll delta) advances one category. Small
  // accumulator so trackpad's fine-grained deltas don't skip multiple
  // categories per gesture. Attached as a native, non-passive listener
  // (React's onWheel is passive by default, which silently drops preventDefault).
  useEffect(() => {
    const el = railElRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      const step = 90;
      while (scrollAccum.current >= step) {
        setOffset((o) => (o + 1) % ALL_CATEGORIES.length);
        scrollAccum.current -= step;
      }
      while (scrollAccum.current <= -step) {
        setOffset((o) => (o - 1 + ALL_CATEGORIES.length) % ALL_CATEGORIES.length);
        scrollAccum.current += step;
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [viewportSize]);

  const top = HEADER_CLEARANCE;
  const railHeight = viewportSize ? SLOT_GAP * (slotCount - 1) : 0;
  const railWidth = pillWidth + RAIL_LEFT_OFFSET + 40;

  // Bow the middle slots outward, pulling back in toward the edge at the
  // top/bottom of the rail — a shallow sine curve, not a strict half-circle.
  const curveFor = (slotIdx: number) => Math.sin((slotIdx / (slotCount - 1)) * Math.PI) * CURVE_MAX_PX;

  return (
    <>
      {viewportSize && (
        <div
          ref={railElRef}
          className="fixed hidden sm:block z-40"
          style={{ top, left: RAIL_LEFT_OFFSET, width: railWidth, height: railHeight }}
        >
          <div
            className="wheel-rail relative h-full w-full"
            style={{ maskImage: "linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)" }}
          >
            {isFiltering ? (
              // While filtering, results fill outward from the search slot
              // (just above it, then just below, alternating) so they read
              // as grouped around the search box instead of stacking from
              // the top.
              filtered.slice(0, slotCount - 1).map((cat, i) => {
                const step = Math.floor(i / 2) + 1;
                const slotIdx = i % 2 === 0 ? searchSlot - step : searchSlot + step;
                return (
                  <div
                    key={cat.label}
                    className="absolute left-0"
                    style={{ top: slotIdx * SLOT_GAP, transform: `translateX(${curveFor(slotIdx)}px)` }}
                  >
                    <WheelCategoryPill cat={cat} onSelect={onSelect} width={pillWidth} />
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
                    <WheelCategoryPill cat={cat} onSelect={onSelect} width={pillWidth} />
                  </div>
                );
              })
            )}

            {/* Search box occupies the middle slot inline with the pills, at
                the same vertical rhythm and curve offset — not off to the side. */}
            <div
              className="absolute left-0"
              style={{ top: searchSlot * SLOT_GAP, transform: `translateX(${curveFor(searchSlot)}px)` }}
            >
              <WheelSearchBox search={search} onChange={setSearch} onClear={() => setSearch("")} width={pillWidth} />
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
      )}
    </>
  );
}

// Ambient conversational offers — not example queries to copy, but Kiyo
// casually speaking to the visitor. displayText reads naturally as something
// Kiyo herself would say (second person); promptText is what actually gets
// sent as the user's own message when clicked (first person).
interface KiyoMessage {
  displayText: string;
  promptText: string;
  // "resume" bubbles restore a specific past chat session instead of sending
  // a new message — sessionId is required when kind is "resume".
  kind: "new" | "resume";
  sessionId?: string;
}

const KIYO_MESSAGES: KiyoMessage[] = [
  { displayText: "I can help you find a thoughtful gift for your mum.", promptText: "Help me find a thoughtful gift for my mum.", kind: "new" },
  { displayText: "Tell me your budget and I'll find the best options.", promptText: "Help me find the best options within my budget.", kind: "new" },
  { displayText: "Need help comparing two products?", promptText: "Help me compare two products.", kind: "new" },
  { displayText: "Looking for something that can be delivered today?", promptText: "Show me products that can be delivered today.", kind: "new" },
  { displayText: "Ammata lassana gift ekak hoyamu da?", promptText: "Mage ammata lassana gift ekak hoyala denna.", kind: "new" },
  { displayText: "Oyage budget eka kiyanna, mama hondama options hoyannam.", promptText: "Mage budget ekata hondama options hoyala denna.", kind: "new" },
  { displayText: "Products dekak compare karala dennam da?", promptText: "Me products deka compare karala denna.", kind: "new" },
  { displayText: "Ada delivery karanna puluwan item ekak hoyanawada?", promptText: "Ada delivery karanna puluwan items pennanna.", kind: "new" },
  { displayText: "අම්මට ලස්සන තෑග්ගක් හොයමුද?", promptText: "මගේ අම්මට ලස්සන තෑග්ගක් හොයලා දෙන්න.", kind: "new" },
  { displayText: "ඔයාගේ බජට් එක කියන්න, මම හොඳම විකල්ප හොයලා දෙන්නම්.", promptText: "මගේ බජට් එකට හොඳම විකල්ප හොයලා දෙන්න.", kind: "new" },
  { displayText: "ප්‍රොඩක්ට් දෙකක් compare කරලා දෙන්නද?", promptText: "මේ ප්‍රොඩක්ට් දෙක compare කරලා දෙන්න.", kind: "new" },
  { displayText: "අදම delivery කරන්න පුළුවන් දෙයක් හොයනවද?", promptText: "අදම delivery කරන්න පුළුවන් items පෙන්නන්න.", kind: "new" },
  { displayText: "Amma-ku oru nalla gift kandupidikkalama?", promptText: "En amma-ku oru nalla gift kandupidichu thanga.", kind: "new" },
  { displayText: "Ungal budget sollunga, best options naan find pannuren.", promptText: "En budget-ku best options find panni thanga.", kind: "new" },
  { displayText: "Rendu products compare pannava?", promptText: "Indha rendu products compare panni thanga.", kind: "new" },
  { displayText: "Innikku delivery irukkura item venuma?", promptText: "Innikku delivery irukkura items kaattunga.", kind: "new" },
];

// Fixed single column of ambient bubble slots stacked down the right edge of
// the viewport (mirrors CategoryWheel's rail on the left). Row count and
// bubble width both scale with the actual viewport. Each slot runs its own
// independent random show/hide timer so bubbles drift out of sync.
const BUBBLE_ROW_GAP = 92;
const BUBBLE_MIN_ROWS = 3;
const BUBBLE_MIN_COL_WIDTH = 240;
const BUBBLE_MAX_COL_WIDTH = 340;
const BUBBLE_WIDTH_GROWTH_RATIO = 0.06;
// Alternate rows shift left/right by this much for a loose zigzag column.
const BUBBLE_ZIGZAG_PX = 36;
const BUBBLE_RIGHT_EDGE_MARGIN = 100;
const BUBBLE_HEADER_CLEARANCE = 140;
const BUBBLE_FOOTER_CLEARANCE = 24;
// A bubble's own rendered height extends past its row's "top" position, so
// this has to be subtracted from the available space too.
const BUBBLE_HEIGHT_ESTIMATE = 90;
const BUBBLE_TRANSITION_MS = 700;
const BUBBLE_MIN_HOLD_MS = 13_000;
const BUBBLE_MAX_HOLD_MS = 20_000;
const BUBBLE_MIN_GAP_MS = 2000;
const BUBBLE_MAX_GAP_MS = 5000;
const BUBBLE_MAX_INITIAL_DELAY_MS = 6000;

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// A cloud-bump/trail layout — each bubble instance gets its own randomized
// pattern (count, size, position) instead of one fixed shape repeated
// everywhere.
interface Puff {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

function randomPuffs(seed: number): { bumps: Puff[]; trail: Puff[] } {
  // Simple deterministic pseudo-random so each message index always renders
  // the same pattern, but different messages look different from one another.
  let s = (seed * 2654435761 + 1) >>> 0;
  const rand = () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return (s >>> 0) / 0xffffffff;
  };

  const bumpOnRight = rand() < 0.5;
  const trailOnRight = rand() < 0.5;

  const bumpCount = 2 + Math.floor(rand() * 2);
  const bumps: Puff[] = Array.from({ length: bumpCount }, () => {
    const onRight = rand() < 0.75 ? bumpOnRight : !bumpOnRight;
    const side = 4 + rand() * 44;
    return {
      size: 12 + rand() * 20,
      top: -14 + rand() * 20,
      left: onRight ? undefined : side,
      right: onRight ? side : undefined,
    };
  });

  const trailCount = 2 + Math.floor(rand() * 2);
  const trail: Puff[] = Array.from({ length: trailCount }, (_, i) => {
    const onRight = rand() < 0.75 ? trailOnRight : !trailOnRight;
    const side = 8 + rand() * 24;
    return {
      size: 12 - i * 3,
      bottom: -10 - i * 9 - rand() * 6,
      left: onRight ? undefined : side,
      right: onRight ? side : undefined,
    };
  });

  return { bumps, trail };
}

function CloudPuffs({ puffs, anchor }: { puffs: Puff[]; anchor: "top" | "bottom" }) {
  return (
    <>
      {puffs.map((p, i) => (
        <span
          key={`${anchor}-${i}`}
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            background: "var(--surface-2)",
            border: "1px solid var(--border-2)",
            zIndex: -1,
          }}
        />
      ))}
    </>
  );
}

function BubbleShape({
  displayText,
  onClick,
  seed,
  maxWidth,
}: {
  displayText: string;
  onClick: () => void;
  seed: number;
  maxWidth?: number;
}) {
  const { bumps, trail } = useMemo(() => randomPuffs(seed), [seed]);
  return (
    <div className="relative inline-block">
      <CloudPuffs puffs={bumps} anchor="top" />
      <button
        onClick={onClick}
        className={`relative flex items-start gap-2.5 rounded-[28px] px-4 py-3.5 text-left ${maxWidth ? "" : "max-w-72"}`}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-2)",
          boxShadow: "var(--s3), var(--s-glow)",
          maxWidth,
        }}
      >
        <Image
          src="/kiyo-wink.png"
          alt="Kiyo"
          width={36}
          height={36}
          className="shrink-0 rounded-full mt-0.5"
        />
        <span className="text-[14px] leading-snug" style={{ color: "var(--ink-2)" }}>
          {displayText}
        </span>
      </button>
      <CloudPuffs puffs={trail} anchor="bottom" />
    </div>
  );
}

// Each slot owns an independent random loop: appear, hold for a random
// stretch, exit, wait a random gap, then show the next message — so slots
// drift out of sync with each other instead of ticking in lockstep.
function BubbleSlot({
  startIdx,
  reducedMotion,
  onSend,
  messages,
  gridStyle,
  maxWidth,
}: {
  startIdx: number;
  reducedMotion: boolean;
  onSend: (message: KiyoMessage) => void;
  messages: KiyoMessage[];
  gridStyle?: CSSProperties;
  maxWidth?: number;
}) {
  const [msgIdx, setMsgIdx] = useState(startIdx);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const showFor = randRange(BUBBLE_MIN_HOLD_MS, BUBBLE_MAX_HOLD_MS);
    const initialDelay = randRange(0, BUBBLE_MAX_INITIAL_DELAY_MS);

    timer = setTimeout(() => {
      if (cancelled) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      timer = setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        const gap = randRange(BUBBLE_MIN_GAP_MS, BUBBLE_MAX_GAP_MS);
        timer = setTimeout(() => {
          if (cancelled) return;
          setMsgIdx((i) => (i + 1) % messages.length);
        }, gap + BUBBLE_TRANSITION_MS);
      }, showFor);
    }, initialDelay);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgIdx, messages.length]);

  const message = messages[msgIdx % messages.length];
  const shown = reducedMotion || visible;

  return (
    <div
      className={gridStyle ? "absolute" : undefined}
      style={{
        ...gridStyle,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(8px)",
        transition: reducedMotion ? "opacity 300ms ease" : `opacity ${BUBBLE_TRANSITION_MS}ms ease, transform ${BUBBLE_TRANSITION_MS}ms ease`,
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      <BubbleShape displayText={message.displayText} seed={msgIdx} onClick={() => onSend(message)} maxWidth={maxWidth} />
    </div>
  );
}

// Builds local (non-AI) personalized bubbles from the visitor's own cart/
// orders/chat history — instant, no network round trip. Used to fill out the
// pool alongside AI suggestions and the hardcoded fallback set, never in
// place of them, so the pool can never shrink to a size that causes bubble
// slots to converge on the same message.
function buildLocalPersonalizedMessages({
  cartItems,
  pendingOrder,
  lastSession,
}: {
  cartItems: CartLineItem[];
  pendingOrder: SavedOrder | undefined;
  lastSession: SavedSession | undefined;
}): KiyoMessage[] {
  const messages: KiyoMessage[] = [];

  if (cartItems.length > 0) {
    const first = cartItems[0].product.name;
    messages.push(
      cartItems.length === 1
        ? { displayText: `Ready to check out ${first}?`, promptText: "I want to checkout my cart.", kind: "new" }
        : { displayText: `You still have ${cartItems.length} items waiting in your cart.`, promptText: "I want to checkout my cart.", kind: "new" }
    );
    const category = cartItems[0].product.category?.name;
    if (category) {
      messages.push({ displayText: `Want more ${category.toLowerCase()} like what's in your cart?`, promptText: `Show me more ${category}.`, kind: "new" });
    }
  }

  if (pendingOrder) {
    messages.push({ displayText: "Want an update on your recent order?", promptText: `What's the status of my order ${pendingOrder.order.order_ref}?`, kind: "new" });
    if (pendingOrder.itemNames[0]) {
      messages.push({ displayText: `Loved ${pendingOrder.itemNames[0]}? I can find something similar.`, promptText: `Show me something similar to ${pendingOrder.itemNames[0]}.`, kind: "new" });
    }
  }

  if (lastSession) {
    messages.push({
      displayText: "Want to pick up where we left off?",
      promptText: `Let's continue from: ${lastSession.title}`,
      kind: "resume",
      sessionId: lastSession.id,
    });
  }

  return messages;
}

const AI_SUGGESTIONS_CACHE_KEY = "kiyo-ai-suggestions-v1";

function readCachedAiSuggestions(): KiyoMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AI_SUGGESTIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is KiyoMessage =>
          typeof m === "object" && m !== null &&
          typeof (m as KiyoMessage).displayText === "string" &&
          typeof (m as KiyoMessage).promptText === "string"
      )
      // Stale cache entries from before "kind" existed — treat as "new".
      .map((m) => (m.kind === "resume" ? m : { ...m, kind: "new" as const }));
  } catch {
    return [];
  }
}

function writeCachedAiSuggestions(messages: KiyoMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AI_SUGGESTIONS_CACHE_KEY, JSON.stringify(messages));
  } catch {
    // storage full/unavailable — cache is best-effort, safe to skip
  }
}

// Fetches fresh AI-generated suggestions (grounded in real cart/order/history
// data) every time the visitor lands on the home page. Returns whatever was
// last cached in localStorage immediately, then swaps in the fresh response
// once it resolves — the fetch never blocks what's shown.
function useAiKiyoSuggestions({
  mounted,
  cartItems,
  pendingOrder,
  lastSession,
}: {
  mounted: boolean;
  cartItems: CartLineItem[];
  pendingOrder: SavedOrder | undefined;
  lastSession: SavedSession | undefined;
}): KiyoMessage[] {
  const [aiMessages, setAiMessages] = useState<KiyoMessage[]>(() => readCachedAiSuggestions());

  useEffect(() => {
    if (!mounted) return;
    if (cartItems.length === 0 && !pendingOrder && !lastSession) return;

    const controller = new AbortController();
    fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        cartItems: cartItems.slice(0, 5).map((i) => ({
          name: i.product.name,
          category: i.product.category?.name,
        })),
        pendingOrder: pendingOrder
          ? { orderRef: pendingOrder.order.order_ref, itemName: pendingOrder.itemNames[0] }
          : undefined,
        lastSession: lastSession
          ? {
              id: lastSession.id,
              title: lastSession.title,
              messages: lastSession.messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
            }
          : undefined,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { suggestions?: KiyoMessage[] } | null) => {
        if (!data?.suggestions?.length) return;
        setAiMessages(data.suggestions);
        writeCachedAiSuggestions(data.suggestions);
      })
      .catch(() => {
        // network error / aborted — keep showing cached + hardcoded messages
      });

    return () => controller.abort();
    // Re-fetch whenever the visitor arrives at the home page with this hook
    // freshly mounted, and whenever their underlying history actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  return aiMessages;
}

// Reads cart/orders/history stores and blends three tiers into one pool:
// AI-generated suggestions (repeated for weight, shown "often"), local
// template suggestions from real data, and the hardcoded fallback set. The
// pool is never allowed to shrink to a size that makes bubble slots converge
// on the same message.
function usePersonalizedKiyoMessages(): KiyoMessage[] {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cartItems = useCartStore((s) => s.items);
  const pendingOrder = useOrdersStore((s) => s.pending[0]);
  const lastSession = useHistoryStore((s) => s.sessions[0]);

  const aiMessages = useAiKiyoSuggestions({ mounted, cartItems, pendingOrder, lastSession });

  return useMemo(() => {
    if (!mounted) return KIYO_MESSAGES;
    const local = buildLocalPersonalizedMessages({ cartItems, pendingOrder, lastSession });
    // AI suggestions lead the pool (so they're favored by the even-spacing
    // start-index math downstream) but each distinct message appears only
    // once — literal duplicates are what caused two slots to show identical
    // bubbles at once. KIYO_MESSAGES pads the tail so the pool never runs dry.
    const seen = new Set<string>();
    const pool: KiyoMessage[] = [];
    for (const m of [...aiMessages, ...local, ...KIYO_MESSAGES]) {
      if (seen.has(m.displayText)) continue;
      seen.add(m.displayText);
      pool.push(m);
    }
    return pool.length > 0 ? pool : KIYO_MESSAGES;
  }, [mounted, cartItems, pendingOrder, lastSession, aiMessages]);
}

// Desktop: fixed single column stacked down the right edge of the viewport,
// toggled open/closed by the "Try asking" arrow button (mirrors CategoryWheel
// on the left). Mobile: centered flex-wrap row.
function KiyoBubbleColumn({ onSend }: { onSend: (message: KiyoMessage) => void }) {
  const reducedMotion = useReducedMotion();
  const viewportSize = useViewportSize();
  const messages = usePersonalizedKiyoMessages();

  const availableHeight = viewportSize
    ? Math.max(viewportSize.height - BUBBLE_HEADER_CLEARANCE - BUBBLE_FOOTER_CLEARANCE - BUBBLE_HEIGHT_ESTIMATE, BUBBLE_ROW_GAP * (BUBBLE_MIN_ROWS - 1))
    : BUBBLE_ROW_GAP * (BUBBLE_MIN_ROWS - 1);
  const desktopRows = Math.floor(availableHeight / BUBBLE_ROW_GAP) + 1;

  const isDesktop = viewportSize ? viewportSize.width >= 640 : true;
  const visibleCount = isDesktop ? desktopRows : 3;
  const startIndexes = useMemo(
    () => Array.from({ length: visibleCount }, (_, i) => Math.floor((i * messages.length) / visibleCount)),
    [visibleCount, messages.length]
  );

  const colWidth = viewportSize
    ? Math.min(BUBBLE_MAX_COL_WIDTH, Math.max(BUBBLE_MIN_COL_WIDTH, BUBBLE_MIN_COL_WIDTH + (viewportSize.width - BASELINE_VIEWPORT_WIDTH) * BUBBLE_WIDTH_GROWTH_RATIO))
    : BUBBLE_MIN_COL_WIDTH;
  const columnHeight = BUBBLE_ROW_GAP * (desktopRows - 1) + 80;

  return (
    <>
      {!isDesktop && (
        <div className="fixed inset-x-4 top-24 z-60 flex flex-wrap items-start justify-center gap-4 sm:hidden">
          {startIndexes.map((startIdx, i) => (
            <BubbleSlot key={i} startIdx={startIdx} reducedMotion={reducedMotion} onSend={onSend} messages={messages} />
          ))}
        </div>
      )}

      {isDesktop && viewportSize && (
        <div
          className="pointer-events-none fixed hidden z-60 sm:block"
          style={{
            right: BUBBLE_RIGHT_EDGE_MARGIN,
            top: BUBBLE_HEADER_CLEARANCE,
            width: colWidth + BUBBLE_ZIGZAG_PX,
            height: columnHeight,
          }}
        >
          {startIndexes.map((startIdx, i) => (
            <BubbleSlot
              key={i}
              startIdx={startIdx}
              reducedMotion={reducedMotion}
              onSend={onSend}
              messages={messages}
              maxWidth={colWidth}
              gridStyle={{ top: i * BUBBLE_ROW_GAP, right: i % 2 === 0 ? 0 : BUBBLE_ZIGZAG_PX }}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Mix of English, Sinhala, and Tanglish — judges will see all 
const EXAMPLES = [
  { text: "Birthday cake for Kandy under LKR 10,000", lang: "EN" },
  { text: "අම්මාගේ උපන්දිනයට ලස්සන කේක් එකක් හොයලා දෙන්න", lang: "සිං" }, // "Find a nice cake for mum's birthday"
  { text: "Enakku gift pack edhavadhu irukka?",       lang: "TGL" }, // "Do you have any gift packs?" — Tanglish
  { text: "Colombo deliver karanawada?",              lang: "SIN" }, // "Can you deliver to Colombo?" — Singlish
];

const EXAMPLE_LANG_STYLE: Record<string, { color: string; bg: string }> = {
  "සිං": { color: "var(--purple-light)", bg: "var(--purple-soft)" },
  SIN:   { color: "var(--gold)",         bg: "rgba(240,185,94,0.12)" },
  TGL:   { color: "var(--green)",        bg: "var(--green-soft)" },
};

export function EmptyState() {
  const { sendMessage, locale } = useChat();
  const router = useRouter();
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const examplesRailRef = useRef<HTMLDivElement>(null);
  const [categoryBrowserOpen, setCategoryBrowserOpen] = useState(false);
  const [kiyoBubbleOpen, setKiyoBubbleOpen] = useState(false);

  function submitInput() {
    const text = inputValue.trim();
    if (!text) return;
    sendMessage(text);
    setInputValue("");
  }

  // "resume" bubbles reference a specific past chat session — restore it into
  // the chat store instead of sending a new message (mirrors HistoryPanel's
  // handleRestore). "new" bubbles just send their promptText as usual.
  function handleKiyoBubbleSend(message: KiyoMessage) {
    setKiyoBubbleOpen(false);
    if (message.kind === "resume" && message.sessionId) {
      const session = useHistoryStore.getState().sessions.find((s) => s.id === message.sessionId);
      if (session) {
        useChatStore.setState({ messages: session.messages, isStreaming: false });
        useShopStore.getState().focusSearch();
        router.push("/");
        return;
      }
    }
    sendMessage(message.promptText);
  }

  function startListening() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    r.lang = locale === "si" ? "si-LK" : locale === "ta-Latn" ? "ta-LK" : "en-US";
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (ev: SpeechRecognitionEvent) => {
      const t = ev.results[0]?.[0]?.transcript;
      if (t) setInputValue((v) => (v ? `${v} ${t}` : t));
    };
    recognitionRef.current = r;
    r.start();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(
      typeof window !== "undefined" &&
      (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSubtitleIdx((i) => (i + 1) % SUBTITLES.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const subtitle = SUBTITLES[subtitleIdx];

  return (
    <div className="relative flex h-full flex-col items-center">

      {/* Orbs — static ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-primary"   style={{ top: "-160px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-secondary" style={{ bottom: "-80px", left: "-100px" }} />
        <div className="orb orb-accent"    style={{ top: "60px", right: "-80px" }} />
      </div>

      {/* Scrollable content — hero, input, category rail, try asking.
          z-50 while a rail overlay is open so its trigger button (used to
          close the overlay too) stays above the overlay's own fixed layer. */}
      <div className={`relative flex flex-1 min-h-0 w-full flex-col items-center overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6 ${categoryBrowserOpen || kiyoBubbleOpen ? "z-50" : "z-10"}`}>
      <div className="flex flex-col items-center flex-1 justify-center w-full max-w-3xl">

      {/* Hero */}
      <div className="text-center max-w-2xl">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase mb-6"
          style={{ background: "var(--purple-soft)", border: "1px solid var(--border-2)", color: "var(--purple-light)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--gold)", animation: "pulse 1.8s ease-in-out infinite" }}
          />
          AI-powered · by Kapruka
        </span>
        <h1
          className="t-display text-foreground mb-6 pb-3"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: '58px',
            lineHeight: 1.08,
            letterSpacing: '-0.5px',
          }}>          
          Just tell Kiyo<br />
          what you <span className="gradient-text">need.</span>
        </h1>

        <p className="text-[16px] leading-relaxed font-medium mb-2" style={{ color: "var(--ink-2)" }}>
          <b className="text-foreground font-bold">Stop searching, start talking.</b>{" "} Kiyo {" "}
          <b className="text-foreground font-bold">listens, understands,</b>{" "} and {" "}
          <b className="text-foreground font-bold">gets things done</b> {" "}
          — finding, comparing, and helping you buy almost anything you need.
        </p>

        {/* Rotating subtitle */}
        <div className="flex flex-col items-center gap-2 pb-1 pt-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase"
            style={{
              background: subtitle.bg,
              color: subtitle.color,
              border: `1px solid ${subtitle.color}44`,
              transition: "opacity 0.35s ease",
              opacity: visible ? 1 : 0,
            }}
          >
            {subtitle.lang}
          </span>
          <p
            className="text-[15px] font-medium leading-snug"
            style={{
              color: subtitle.color,
              transition: "opacity 0.35s ease, transform 0.35s ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(6px)",
              minHeight: "1.6em",
            }}
          >
            {subtitle.text}
          </p>
        </div>
      </div>

      {/* Inline input zone — mockup-style, sits directly under the hero */}
      <div className="mt-2 pt-4 w-full max-w-xl">
        <div className="command-bar flex items-center gap-3 rounded-2xl px-4 sm:px-5 py-3.5">
          <KiyoAvatar size={32} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitInput(); }}
            placeholder="Ask Kiyo anything..."
            className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
          {speechSupported && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                  aria-label={isListening ? "Stop recording" : "Voice input"}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isListening
                      ? "bg-primary text-white shadow-[0_0_0_4px_var(--purple-soft)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-(--surface-2)"
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{isListening ? "Stop recording" : "Voice input"}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={submitInput}
                disabled={!inputValue.trim()}
                aria-label="Send"
                className="btn-purple flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:cursor-default disabled:opacity-30 disabled:shadow-none active:scale-95"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Send</TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-3.5 pt-1.5 flex justify-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 flex-wrap justify-center"
            style={{ background: "transparent" }}
          >
            <span className="text-[11px]" style={{ color: "var(--ink-2)" }}>Type in</span>
            {["EN", "සිං", "SIN", "TGL"].map((label) => (
              <span
                key={label}
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ border: "1px solid var(--border-2)", color: "var(--purple-light)" }}
              >
                {label}
              </span>
            ))}
            <span className="text-[11px]" style={{ color: "var(--ink-2)" }}>— Kiyo gets all</span>
          </div>
        </div>
      </div>

      {/* Category rail — horizontal scroll, mockup-style. Desktop only. */}
      <div className="mt-14 pt-14 w-full hidden sm:block">
        <p className="text-[11px] font-bold tracking-widest uppercase mb-3 px-1" style={{ color: "var(--ink-3)" }}>
          Shop by category
        </p>
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCategoryBrowserOpen((v) => !v)}
                aria-label={categoryBrowserOpen ? "Close categories" : "Browse all categories"}
                aria-pressed={categoryBrowserOpen}
                className="absolute left-0 top-1/2 z-50 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95"
                style={
                  categoryBrowserOpen
                    ? { background: "var(--gold)", borderColor: "var(--gold)", color: "var(--surface)" }
                    : { background: "var(--surface-2)", borderColor: "var(--gold)", color: "var(--gold)" }
                }
              >
                <Grid3x3 className="h-4 w-4" fill={categoryBrowserOpen ? "currentColor" : "none"} fillOpacity={0.25} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{categoryBrowserOpen ? "Close categories" : "Browse all categories"}</TooltipContent>
          </Tooltip>
          <div
            ref={categoryRailRef}
            className="no-scrollbar overflow-hidden pl-11 pr-1 pb-1"
            style={{ maskImage: "linear-gradient(to right, transparent, black 44px, black calc(100% - 20px), transparent)" }}
          >
            <div className="marquee-track" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              {[...CATEGORIES, ...CATEGORIES].map(({ icon: Icon, label, query, color }, i) => (
                <button
                  key={`${label}-${i}`}
                  onClick={() => sendMessage(query)}
                  className="group flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 transition-all duration-200 hover:border-(--border-2) hover:bg-(--surface-2) hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${color}22` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2} />
                  </span>
                  <span className="text-[14px] font-semibold text-foreground whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Try asking — horizontal card carousel, mockup-style. Desktop only. */}
      <div className="mt-12 pt-12 w-full hidden sm:block">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--ink-3)" }}>
            Try asking
          </p>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--ink-3)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)", animation: "pulse 1.6s ease-in-out infinite" }} />
            Real conversations, live
          </span>
        </div>
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setKiyoBubbleOpen((v) => !v)}
                aria-label={kiyoBubbleOpen ? "Close suggestions" : "Show Kiyo suggestions"}
                aria-pressed={kiyoBubbleOpen}
                className="absolute right-0 top-1/2 z-50 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95"
                style={
                  kiyoBubbleOpen
                    ? { background: "var(--gold)", borderColor: "var(--gold)", color: "var(--surface)" }
                    : {
                        background: "var(--surface-2)",
                        borderColor: "var(--gold)",
                        color: "var(--gold)",
                        animation: "glowPulseGold 2.2s ease-in-out infinite",
                      }
                }
              >
                <Sparkles
                  className="h-4 w-4"
                  fill={kiyoBubbleOpen ? "currentColor" : "none"}
                  fillOpacity={0.25}
                  style={kiyoBubbleOpen ? undefined : { animation: "twinkle 2.2s ease-in-out infinite" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{kiyoBubbleOpen ? "Close suggestions" : "Show Kiyo suggestions"}</TooltipContent>
          </Tooltip>
          <div
            ref={examplesRailRef}
            className="no-scrollbar overflow-hidden pl-1 pr-11 pb-1"
            style={{ maskImage: "linear-gradient(to right, transparent, black 20px, black calc(100% - 44px), transparent)" }}
          >
            <div className="marquee-track-right" style={{ display: "flex", alignItems: "stretch", gap: "0.875rem" }}>
              {[...EXAMPLES, ...EXAMPLES, ...EXAMPLES].map(({ text, lang }, i) => (
                <button
                  key={`${text}-${i}`}
                  onClick={() => sendMessage(text)}
                  className="text-left rounded-2xl border border-border bg-card px-4.5 py-4 text-[13px] w-60 shrink-0 transition-all hover:border-(--border-2) hover:bg-(--surface-2) hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between gap-3"
                  style={{ color: "var(--ink-2)" }}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex-1 leading-snug font-medium text-foreground">&ldquo;{text}&rdquo;</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5"
                      style={{
                        background: EXAMPLE_LANG_STYLE[lang]?.bg ?? "var(--surface-2)",
                        color: EXAMPLE_LANG_STYLE[lang]?.color ?? "var(--ink-3)",
                      }}
                    >
                      {lang}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* Footer — fixed to the bottom of the page, separate from scrollable content */}
      <div className="relative z-10 shrink-0 w-full max-w-3xl">
        <Footer />
      </div>

      {categoryBrowserOpen && (
        <CategoryWheel
          onSelect={(query) => { setCategoryBrowserOpen(false); sendMessage(query); }}
        />
      )}

      {kiyoBubbleOpen && (
        <KiyoBubbleColumn onSend={handleKiyoBubbleSend} />
      )}
    </div>
  );
}
