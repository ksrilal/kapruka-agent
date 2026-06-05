"use client";

import { useState, useEffect } from "react";
import { Cake, Flower2, Gift, Candy, Gem, Baby, ShoppingBag, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useChat } from "@/features/chat/hooks/useChat";

interface Category {
  icon: LucideIcon;
  label: string;
  query: string;
  color: string;
}

const SUBTITLES = [
  { lang: "English",  text: "Tell me what you're looking for.",  color: "var(--ink-2)",        bg: "var(--surface-2)" },
  { lang: "සිංහල",   text: "ඔබට අවශ්‍ය දේ කියන්න.",            color: "var(--purple-light)", bg: "var(--purple-soft)" },
  { lang: "Tanglish", text: "Oyata ona de kiyanna.",             color: "var(--accent)",       bg: "var(--accent-soft)" },
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

// Mix of English, Sinhala, and Tanglish — judges will see all three
const EXAMPLES = [
  { text: "Birthday cake for Kandy under LKR 3,000", lang: "EN" },
  { text: "කොළඹ මගේ අම්මාට මල් යවන්න", lang: "සිං" },           // "Send flowers to my mum in Colombo"
  { text: "Flowers for my mum in Colombo",            lang: "EN" },
  { text: "Anna gift pack onnum iruka?",              lang: "TGL" }, // "Any gift packs available?" — Tanglish
  { text: "Best gifts for a 5-year-old",              lang: "EN" },
  { text: "Colombo deliver karanawada?",              lang: "TGL" }, // "Can you deliver to Colombo?"
];

export function EmptyState() {
  const { sendMessage } = useChat();
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [visible, setVisible] = useState(true);

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
    <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto px-6 pb-10 pt-6">

      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-primary"   style={{ top: "-160px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-secondary" style={{ bottom: "-80px", left: "-100px" }} />
        <div className="orb orb-accent"    style={{ top: "60px", right: "-80px" }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center max-w-2xl">
        <p className="text-[13px] font-semibold tracking-widest uppercase pb-2 mb-5" style={{ color: "var(--purple-light)" }}>
          Kiyo · Powered by Kapruka
        </p>
        <h1 className="t-display text-foreground mb-6 pb-3">
          Shopping that starts<br />
          <span className="gradient-text">with a conversation.</span>
        </h1>

        {/* Rotating subtitle */}
        <div className="flex flex-col items-center gap-2 pb-5">
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
            className="text-[18px] font-medium leading-snug"
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

      {/* Category chips */}
      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {CATEGORIES.map(({ icon: Icon, label, query, color }) => (
          <button
            key={label}
            onClick={() => sendMessage(query)}
            className="group flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 transition-all duration-200 hover:border-(--border-2) hover:bg-(--surface-2) hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${color}22` }}
            >
              <Icon className="h-3 w-3" style={{ color }} strokeWidth={2} />
            </span>
            <span className="text-[13px] font-medium text-foreground whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {/* Example prompts — 2-column grid */}
      <div className="relative z-10 mt-8 w-full max-w-2xl pt-7">
        <p className="text-center text-[11px] tracking-widest uppercase font-medium mb-3 pb-3" style={{ color: "var(--ink-3)" }}>
          Try asking...
        </p>
        <div className="grid grid-cols-2 gap-2">
        {EXAMPLES.map(({ text, lang }) => (
          <button
            key={text}
            onClick={() => sendMessage(text)}
            className="text-left rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] transition-all hover:border-(--border-2) hover:bg-(--surface-2) hover:-translate-y-0.5 active:scale-[0.98] flex items-start justify-between gap-2"
            style={{ color: "var(--ink-2)" }}
          >
            <span className="flex-1 leading-snug">&ldquo;{text}&rdquo;</span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5"
              style={{
                background: lang === "සිං" ? "var(--purple-soft)" : lang === "TGL" ? "var(--accent-soft)" : "var(--surface-2)",
                color: lang === "සිං" ? "var(--purple-light)" : lang === "TGL" ? "var(--accent)" : "var(--ink-3)",
              }}
            >
              {lang}
            </span>
          </button>
        ))}
        </div>
      </div>

    </div>
  );
}
