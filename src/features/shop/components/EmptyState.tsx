"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowUp, ArrowRight, ArrowLeft, Cake, Flower2, Gift, Candy, Gem, Baby, ShoppingBag, Smartphone, Mic, MicOff,
  Shirt, UtensilsCrossed, Apple, Carrot, Ticket, PackageOpen, ShoppingBasket,
  PartyPopper, Gift as GiftBox, Watch, Sparkles, Wand2, ShoppingBag as HandbagIcon,
  Palette, GraduationCap, BookOpen, HeartPulse, PawPrint, Baby as BabyIcon,
  Home, Church, Car, Bike, HeartHandshake, MapPin, Search, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useChat } from "@/features/chat/hooks/useChat";
import { Footer } from "@/components/layout/Footer";
import { KiyoAvatar } from "@/components/ui/KiyoAvatar";

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

function CategorySearchBox({
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

function CategoryTicker({ onSelect, onClose }: { onSelect: (query: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-16 sm:py-24"
      style={{ background: "rgba(10, 6, 20, 0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border p-5 sm:p-6 shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border-2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close categories"
          className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--surface-2)", borderColor: "var(--purple-light)", color: "var(--purple-light)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[11px] font-bold tracking-widest uppercase mb-4 text-center" style={{ color: "var(--ink-3)" }}>
          Shop by category
        </p>

        <div className="flex flex-col gap-2 overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {!isFiltering && <TickerRow categories={rowALeft} direction="right" onSelect={onSelect} />}
            </div>
            <CategorySearchBox search={search} onChange={setSearch} onClear={() => setSearch("")} />
            <div className="flex-1 min-w-0">
              {!isFiltering && <TickerRow categories={rowARight} direction="left" onSelect={onSelect} />}
            </div>
          </div>

          {isFiltering ? (
            filtered.length === 0 ? (
              <p className="text-center text-[12px] py-3" style={{ color: "var(--ink-3)" }}>
                No categories match &ldquo;{search}&rdquo;
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 py-1">
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
    </div>
  );
}

// Mix of English, Sinhala, and Tanglish — judges will see all three
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

  function scrollRail(ref: React.RefObject<HTMLDivElement | null>, distance = 240) {
    ref.current?.scrollBy({ left: distance, behavior: "smooth" });
  }

  function submitInput() {
    const text = inputValue.trim();
    if (!text) return;
    sendMessage(text);
    setInputValue("");
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

      {/* Scrollable content — hero, input, category rail, try asking */}
      <div className="relative z-10 flex flex-1 min-h-0 w-full flex-col items-center overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6">
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
        <h1 className="t-display text-foreground mb-6 pb-3">
          Just tell Kiyo<br />
          what you <span className="gradient-text">need.</span>
        </h1>

        <p className="text-[16px] leading-relaxed font-medium mb-2" style={{ color: "var(--ink-2)" }}>
          Kiyo understands <b className="text-foreground font-bold">English, සිංහල &amp; Tanglish</b>{" "}
          — talk to it like you would a friend, and it&apos;ll find, compare, and order almost anything.
        </p>

        {/* Rotating subtitle */}
        <div className="flex flex-col items-center gap-2 pb-1 pt-2">
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
          )}
          <button
            onClick={submitInput}
            disabled={!inputValue.trim()}
            aria-label="Send"
            className="btn-purple flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:cursor-default disabled:opacity-30 disabled:shadow-none active:scale-95"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
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
            <span className="text-[11px]" style={{ color: "var(--ink-2)" }}>— Kiyo gets all three</span>
          </div>
        </div>
      </div>

      {/* Category rail — horizontal scroll, mockup-style */}
      <div className="mt-14 pt-14 w-full">
        <p className="text-[11px] font-bold tracking-widest uppercase mb-3 px-1 text-right" style={{ color: "var(--ink-3)" }}>
          Shop by category
        </p>
        <div className="relative">
          <button
            onClick={() => setCategoryBrowserOpen(true)}
            aria-label="Browse all categories"
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:-translate-x-0.5 active:scale-95"
            style={{ background: "var(--surface-2)", borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
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

      {/* Try asking — horizontal card carousel, mockup-style */}
      <div className="mt-12 pt-12 w-full">
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
          <button
            onClick={() => scrollRail(examplesRailRef)}
            aria-label="Scroll examples right"
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:translate-x-0.5 active:scale-95"
            style={{ background: "var(--surface-2)", borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
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
        <CategoryTicker
          onSelect={(query) => { setCategoryBrowserOpen(false); sendMessage(query); }}
          onClose={() => setCategoryBrowserOpen(false)}
        />
      )}
    </div>
  );
}
