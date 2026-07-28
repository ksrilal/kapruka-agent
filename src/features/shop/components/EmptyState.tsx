"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { useChat } from "@/features/chat/hooks/useChat";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";
import { CommandBar } from "@/features/chat/components/CommandBar";
import { CategoryWheel } from "./CategoryWheel";
import { KiyoBubble } from "./KiyoBubble";
import { Footer } from "@/components/layout/Footer";

const SUBTITLES = [
  { lang: "English",             text: "Tell me what you're looking for.",  color: "var(--ink-2)",        bg: "var(--surface-2)" },
  { lang: "සිංහල",              text: "ඔබට අවශ්‍ය දේ කියන්න.",            color: "var(--purple-light)", bg: "var(--purple-soft)" },
  { lang: "Sinhala", text: "Oya mokakda hoyanne?",              color: "var(--purple-light)", bg: "var(--purple-soft)" },
  { lang: "Tanglish",            text: "Unakku enna venumo sollu.",         color: "var(--accent)",       bg: "var(--accent-soft)" },
];

export function EmptyState() {
  const { sendMessage } = useChat();
  const isDesktop = useIsDesktop();
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

  // On shorter viewports this page can scroll (see spacing comments below) —
  // surface a scroll-to-top button once the user has actually scrolled down,
  // so getting back to the input/hero doesn't require manual scrolling.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      setScrolled((el?.scrollTop ?? 0) > 40);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={scrollRef} className="scrollbar-visible relative flex h-full flex-col items-center overflow-y-auto px-4 sm:px-6 pt-3 sm:pt-6">

      {/* Scroll-to-top — only appears once the user has actually scrolled
          down (shorter viewports can make this page taller than the
          viewport), so returning to the input never requires manual
          scrolling. Fixed within this panel, not the whole page. */}
      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
          scrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-2)",
          boxShadow: "var(--s3)",
          color: "var(--ink-2)",
        }}
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {/* Orbs — static ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-primary"   style={{ top: "-160px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-secondary" style={{ bottom: "-80px", left: "-100px" }} />
        <div className="orb orb-accent"    style={{ top: "60px", right: "-80px" }} />
      </div>

      {/* Main content — one shared column width (max-w-2xl) from hero to
          footer, so the whole page reads as a single composition. Centered
          in the viewport via my-auto. Desktop vertical rhythm uses clamp()
          tied to viewport height (dvh) instead of fixed px, so spacing
          compresses automatically on shorter screens and never forces a
          scrollbar, while still expanding generously on taller ones. */}
      <div className="relative z-10 flex flex-col items-center justify-center sm:justify-start flex-1 w-full max-w-2xl my-auto py-6 sm:py-[clamp(0.5rem,2dvh,1.25rem)]">

      {/* Hero — immersive on desktop, compact on mobile (input lives in the fixed CommandBar there) */}
      <div className="text-center w-full">
        <p className="block text-[13px] font-semibold tracking-widest uppercase pb-2 pt-28 mb-[clamp(0.25rem,1dvh,0.75rem)]" style={{ color: "var(--purple-light)" }}>
          Kiyo · Powered by Kapruka
        </p>
        <h1 className="t-display text-foreground mb-2 sm:mb-[clamp(0.5rem,1.5dvh,1rem)] pb-1 sm:pb-3">
          Shopping starts<br />
          <span className="gradient-text">with a conversation.</span>
        </h1>

        {/* Rotating subtitle */}
        <div className="flex flex-col items-center gap-2 pb-2 sm:pb-[clamp(0.5rem,1.5dvh,1rem)]">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase"
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
            className="text-[15px] sm:text-[18px] font-medium leading-snug"
            style={{
              color: subtitle.color,
              transition: "opacity 0.35s ease, transform 0.35s ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(6px)",
              minHeight: "1.4em",
            }}
          >
            {subtitle.text}
          </p>
        </div>
      </div>

      {/* Desktop: the input is the natural continuation of the hero, not a
          separate section further down — same component that docks to the
          bottom once a conversation starts (see AppShell). */}
      {isDesktop && (
        <div className="w-full pt-3 sm:pt-[clamp(2rem,4dvh,3rem)]">
          <CommandBar variant="inline" />
        </div>
      )}

      {/* Kiyo ambient bubbles — mobile: in normal document flow directly
          below the hero (the real input is fixed to the bottom of the
          viewport there instead), so this padding clears the bubbles'
          decorative cloud-bump overhang (see KiyoBubble's randomPuffs).
          Desktop: KiyoBubble renders itself as a fixed column anchored just
          below the header, pinned to the right edge of the viewport, so
          this wrapper contributes no spacing there. */}
      <div className="w-full pt-4 sm:pt-0">
        <KiyoBubble onSend={sendMessage} />
      </div>

      {/* Categories — continuously flowing conveyor pinned to the left edge
          of the viewport, independent of this centered column's flow (see
          CategoryWheel). Desktop-only. */}
      <CategoryWheel onSend={sendMessage} />
      </div>

      {/* Footer — fixed to the bottom of the viewport instead of trailing
          the scrollable content, so it's always reachable without scrolling.
          Same transparent, no-background styling as before. */}
      <div
        className="pointer-events-auto fixed bottom-0 left-1/2 z-30 hidden w-full max-w-2xl sm:block"
        style={{ transform: "translateX(-50%)" }}
      >
        <Footer />
      </div>
    </div>
  );
}
