"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";

// Ambient conversational offers — not example queries to copy, but Kiyo
// casually speaking to the visitor. displayText reads naturally as something
// Kiyo herself would say (second person); promptText is what actually gets
// sent as the user's own message when clicked (first person), since sending
// Kiyo's own line back to her as "the user's words" read oddly.
interface KiyoMessage {
  displayText: string;
  promptText: string;
}

const MESSAGES: KiyoMessage[] = [
  {
    displayText: "I can help you find a thoughtful gift for your mum.",
    promptText: "Help me find a thoughtful gift for my mum.",
  },
  {
    displayText: "Tell me your budget and I'll find the best options.",
    promptText: "Help me find the best options within my budget.",
  },
  {
    displayText: "Need help comparing two products?",
    promptText: "Help me compare two products.",
  },
  {
    displayText: "Looking for something that can be delivered today?",
    promptText: "Show me products that can be delivered today.",
  },
  {
    displayText: "Ammata lassana gift ekak hoyamu da?",
    promptText: "Mage ammata lassana gift ekak hoyala denna.",
  },
  {
    displayText: "Oyage budget eka kiyanna, mama hondama options hoyannam.",
    promptText: "Mage budget ekata hondama options hoyala denna.",
  },
  {
    displayText: "Products dekak compare karala dennam da?",
    promptText: "Me products deka compare karala denna.",
  },
  {
    displayText: "Ada delivery karanna puluwan item ekak hoyanawada?",
    promptText: "Ada delivery karanna puluwan items pennanna.",
  },
  {
    displayText: "අම්මට ලස්සන තෑග්ගක් හොයමුද?",
    promptText: "මගේ අම්මට ලස්සන තෑග්ගක් හොයලා දෙන්න.",
  },
  {
    displayText: "ඔයාගේ බජට් එක කියන්න, මම හොඳම විකල්ප හොයලා දෙන්නම්.",
    promptText: "මගේ බජට් එකට හොඳම විකල්ප හොයලා දෙන්න.",
  },
  {
    displayText: "ප්‍රොඩක්ට් දෙකක් compare කරලා දෙන්නද?",
    promptText: "මේ ප්‍රොඩක්ට් දෙක compare කරලා දෙන්න.",
  },
  {
    displayText: "අදම delivery කරන්න පුළුවන් දෙයක් හොයනවද?",
    promptText: "අදම delivery කරන්න පුළුවන් items පෙන්නන්න.",
  },
  {
    displayText: "Amma-ku oru nalla gift kandupidikkalama?",
    promptText: "En amma-ku oru nalla gift kandupidichu thanga.",
  },
  {
    displayText: "Ungal budget sollunga, best options naan find pannuren.",
    promptText: "En budget-ku best options find panni thanga.",
  },
  {
    displayText: "Rendu products compare pannava?",
    promptText: "Indha rendu products compare panni thanga.",
  },
  {
    displayText: "Innikku delivery irukkura item venuma?",
    promptText: "Innikku delivery irukkura items kaattunga.",
  },
];

// Fixed single column of ambient bubble slots stacked down the right edge
// of the viewport (balances the category rail pinned to the left). Row
// count (height) and bubble width both scale with the actual viewport, so
// the column always extends close to the footer and uses the space
// actually available on wider screens, instead of a fixed size tuned for
// one common resolution. Each slot runs its own independent random timer,
// so bubbles appear and disappear on staggered schedules rather than all
// together.
const ROW_GAP = 92;
const MIN_ROWS = 3;
const MIN_COL_WIDTH = 240;
const MAX_COL_WIDTH = 340;
const WIDTH_GROWTH_RATIO = 0.06;
const BASELINE_VIEWPORT_WIDTH = 1440;
// Alternate rows shift left/right by this much, so the column reads as a
// loose zigzag rather than a rigid flush-left stack.
const ZIGZAG_PX = 36;
// Gap between the zigzag's rightmost extent and the true viewport edge.
const RIGHT_EDGE_MARGIN = 100;
// Anchors the column's top just below the fixed header (4rem/64px) instead
// of vertically centering on the input, which left a large empty band
// between the header and the first visible bubble on common viewport
// heights.
const HEADER_CLEARANCE = 88;
// Clear space to leave above the fixed footer at the bottom of the column.
// Kept small so shorter viewports don't end up with an oversized empty
// band below the last bubble compared to the tight rhythm above it.
const FOOTER_CLEARANCE = 24;
// A bubble's own rendered height (can wrap to 2 lines) extends past its
// row's "top" position (row spacing is measured top-to-top), so the
// column's true bottom-most extent is more than the top-to-top distance —
// this has to be subtracted from the available space too, or the last
// bubble overflows past the intended footer clearance.
const BUBBLE_HEIGHT_ESTIMATE = 90;
// Mobile has no extra side space to spread into, so it keeps the original,
// smaller centered-row count instead of the desktop column's dynamic count.
const MOBILE_VISIBLE_COUNT = 3;

// Returns null until mounted on the client and the real viewport has been
// measured. The desktop column's whole layout (row count, bubble width)
// depends on window dimensions the server can't know, so rendering a
// guessed value during SSR and swapping it after mount causes a hydration
// mismatch — callers should render nothing until this resolves.
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
const TRANSITION_MS = 500;
// Each bubble stays on screen at least this long once fully visible.
const MIN_HOLD_MS = 10_000;
const MAX_HOLD_MS = 16_000;
// Random pause after a bubble exits before it (or the next message in that
// slot) reappears — keeps slots from re-syncing over time.
const MIN_GAP_MS = 1500;
const MAX_GAP_MS = 5000;
// Random initial delay so the three slots don't all start at once on mount.
const MAX_INITIAL_DELAY_MS = 6000;

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

// A cloud-bump/trail layout, matching the CodePen reference's :before/:after
// box-shadow-drawn circles. Each bubble instance gets its own randomized
// pattern (count, size, position) instead of one fixed shape repeated
// everywhere, matching the reference's varied per-card look.
interface Puff {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

function randomPuffs(seed: number): { bumps: Puff[]; trail: Puff[] } {
  // Simple deterministic pseudo-random so each message index always renders
  // the same pattern (no layout jitter on re-render), but different messages
  // look different from one another. Mixed harder than a plain LCG so
  // consecutive seeds (sequential message indexes) don't land on
  // near-identical low bits and produce visually-same corner choices.
  let s = (seed * 2654435761 + 1) >>> 0;
  const rand = () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return (s >>> 0) / 0xffffffff;
  };

  // Pick which corner each cluster favors so bumps/trail don't always land
  // top-left / bottom-right — each bubble gets its own random pairing.
  const bumpOnRight = rand() < 0.5;
  const trailOnRight = rand() < 0.5;

  const bumpCount = 2 + Math.floor(rand() * 2); // 2-3
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

  const trailCount = 2 + Math.floor(rand() * 2); // 2-3
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
// stretch (at least MIN_HOLD_MS), exit, wait a random gap, then show the
// next message — so slots drift out of sync with each other instead of
// ticking in lockstep.
function BubbleSlot({
  startIdx,
  reducedMotion,
  onSend,
  gridStyle,
  maxWidth,
}: {
  startIdx: number;
  reducedMotion: boolean;
  onSend: (text: string) => void;
  // When set, the slot is absolutely positioned within a fixed grid
  // (desktop). When omitted, it renders in normal document flow (mobile).
  gridStyle?: React.CSSProperties;
  maxWidth?: number;
}) {
  const [msgIdx, setMsgIdx] = useState(startIdx);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const showFor = randRange(MIN_HOLD_MS, MAX_HOLD_MS);
    const initialDelay = randRange(0, MAX_INITIAL_DELAY_MS);

    timer = setTimeout(() => {
      if (cancelled) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      timer = setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        const gap = randRange(MIN_GAP_MS, MAX_GAP_MS);
        timer = setTimeout(() => {
          if (cancelled) return;
          setMsgIdx((i) => (i + 1) % MESSAGES.length);
        }, gap + TRANSITION_MS);
      }, showFor);
    }, initialDelay);

    return () => { cancelled = true; clearTimeout(timer); };
    // Re-runs each time msgIdx advances, starting the next cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgIdx]);

  const message = MESSAGES[msgIdx % MESSAGES.length];
  const shown = reducedMotion || visible;

  return (
    <div
      className={gridStyle ? "absolute" : undefined}
      style={{
        ...gridStyle,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(8px)",
        transition: reducedMotion ? "opacity 300ms ease" : `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      <BubbleShape displayText={message.displayText} seed={msgIdx} onClick={() => onSend(message.promptText)} maxWidth={maxWidth} />
    </div>
  );
}

// Desktop: fixed single column stacked down the right edge of the viewport
// (balances the category rail pinned to the left). Mobile: centered
// flex-wrap row below the input, unchanged from before. Either way, no gap
// thresholds, so it can never silently fail to render because of layout it
// doesn't control.
export function KiyoBubble({ onSend }: { onSend: (text: string) => void }) {
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const viewportSize = useViewportSize();

  // Fill the space between the header and the footer instead of a fixed row
  // count tuned for one screen height. Falls back to the minimum until the
  // viewport is measured (see useViewportSize) — safe because the desktop
  // column renders null in that case anyway, this just keeps every hook
  // below unconditional.
  const availableHeight = viewportSize
    ? Math.max(viewportSize.height - HEADER_CLEARANCE - FOOTER_CLEARANCE - BUBBLE_HEIGHT_ESTIMATE, ROW_GAP * (MIN_ROWS - 1))
    : ROW_GAP * (MIN_ROWS - 1);
  const desktopRows = Math.floor(availableHeight / ROW_GAP) + 1;

  const visibleCount = isDesktop ? desktopRows : MOBILE_VISIBLE_COUNT;
  // Spread each slot's starting message across the deck so they don't all
  // begin on the same line.
  const startIndexes = useMemo(
    () => Array.from({ length: visibleCount }, (_, i) => Math.floor((i * MESSAGES.length) / visibleCount)),
    [visibleCount]
  );

  if (!isDesktop) {
    return (
      <div className="flex flex-wrap items-start justify-center gap-4">
        {startIndexes.map((startIdx, i) => (
          <BubbleSlot key={i} startIdx={startIdx} reducedMotion={reducedMotion} onSend={onSend} />
        ))}
      </div>
    );
  }

  // Not yet mounted/measured — render nothing rather than a guessed size
  // that would then change and mismatch the server-rendered HTML. Placed
  // after all hooks above so their call order/count never changes between
  // this render and the next.
  if (!viewportSize) return null;

  // Bubbles grow slightly on wider screens (more side space to use) but
  // only by a fraction of the extra width, and capped, so they don't
  // stretch to fill very wide monitors.
  const colWidth = Math.min(
    MAX_COL_WIDTH,
    Math.max(MIN_COL_WIDTH, MIN_COL_WIDTH + (viewportSize.width - BASELINE_VIEWPORT_WIDTH) * WIDTH_GROWTH_RATIO)
  );
  const columnHeight = ROW_GAP * (desktopRows - 1) + 80;

  return (
    <div
      className="pointer-events-none fixed hidden sm:block"
      style={{
        right: RIGHT_EDGE_MARGIN,
        top: HEADER_CLEARANCE,
        width: colWidth + ZIGZAG_PX,
        height: columnHeight,
      }}
    >
      {startIndexes.map((startIdx, i) => (
        <BubbleSlot
          key={i}
          startIdx={startIdx}
          reducedMotion={reducedMotion}
          onSend={onSend}
          maxWidth={colWidth}
          // Alternate rows sit flush with the container's right edge or
          // shifted left by ZIGZAG_PX, so the column reads as a loose
          // zigzag rather than a rigid flush stack.
          gridStyle={{ top: i * ROW_GAP, right: i % 2 === 0 ? 0 : ZIGZAG_PX }}
        />
      ))}
    </div>
  );
}
