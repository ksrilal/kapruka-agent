"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// Ambient conversational offers — not example queries to copy, but Kiyo
// casually speaking to the visitor. Every line reads naturally as something
// Kiyo herself would say, so clicking can send it as-is.
const MESSAGES = [
  "I can help you find a thoughtful gift for your mum.",
  "Tell me your budget and I'll find the best options.",
  "Need help comparing two products?",
  "Looking for something that can be delivered today?",
  "Ammata lassana gift ekak hoyamu da?",
  "Oyage budget eka kiyanna, mama hondama options hoyannam.",
  "Products dekak compare karala dennam da?",
  "Ada delivery karanna puluwan item ekak hoyanawada?",
  "අම්මට ලස්සන තෑග්ගක් හොයමුද?",
  "ඔයාගේ බජට් එක කියන්න, මම හොඳම විකල්ප හොයලා දෙන්නම්.",
  "ප්‍රොඩක්ට් දෙකක් compare කරලා දෙන්නද?",
  "අදම delivery කරන්න පුළුවන් දෙයක් හොයනවද?",
  "Amma-ku oru nalla gift kandupidikkalama?",
  "Ungal budget sollunga, best options naan find pannuren.",
  "Rendu products compare pannava?",
  "Innikku delivery irukkura item venuma?",
];

// How many ambient bubble slots to show below the input at once. Each slot
// runs its own independent random timer, so they appear and disappear on
// staggered schedules rather than all together.
const VISIBLE_COUNT = 3;
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
  text,
  onClick,
  seed,
}: {
  text: string;
  onClick: () => void;
  seed: number;
}) {
  const { bumps, trail } = useMemo(() => randomPuffs(seed), [seed]);
  return (
    <div className="relative inline-block">
      <CloudPuffs puffs={bumps} anchor="top" />
      <button
        onClick={onClick}
        className="relative flex max-w-72 items-start gap-2.5 rounded-[28px] px-4 py-3.5 text-left"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-2)",
          boxShadow: "var(--s3), var(--s-glow)",
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
          {text}
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
}: {
  startIdx: number;
  reducedMotion: boolean;
  onSend: (text: string) => void;
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

  const text = MESSAGES[msgIdx % MESSAGES.length];
  const shown = reducedMotion || visible;

  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(8px)",
        transition: reducedMotion ? "opacity 300ms ease" : `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
      }}
    >
      <BubbleShape text={text} seed={msgIdx} onClick={() => onSend(text)} />
    </div>
  );
}

// Renders in normal document flow below the input — no viewport measuring,
// no gap thresholds, so it can never silently fail to render because of
// layout it doesn't control.
export function KiyoBubble({ onSend }: { onSend: (text: string) => void }) {
  const reducedMotion = useReducedMotion();

  // Spread each slot's starting message across the deck so they don't all
  // begin on the same line.
  const startIndexes = useMemo(
    () => Array.from({ length: VISIBLE_COUNT }, (_, i) => Math.floor((i * MESSAGES.length) / VISIBLE_COUNT)),
    []
  );

  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      {startIndexes.map((startIdx, i) => (
        <BubbleSlot key={i} startIdx={startIdx} reducedMotion={reducedMotion} onSend={onSend} />
      ))}
    </div>
  );
}
