"use client";

import { useMemo } from "react";

interface BubbleConfig {
  id: number;
  size: number;       // px
  left: number;       // % from left
  duration: number;   // seconds to rise
  delay: number;      // seconds before starting
  wobble: number;     // horizontal wobble amplitude px
  opacity: number;
}

const COUNT = 18;

function seededRandom(seed: number) {
  // Simple deterministic pseudo-random so SSR and client match
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function Bubbles() {
  const bubbles = useMemo<BubbleConfig[]>(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      size: Math.round(seededRandom(i * 7) * 60 + 16),           // 16–76px
      left: Math.round(seededRandom(i * 13) * 92 + 2),            // 2–94%
      duration: Math.round((seededRandom(i * 3) * 14 + 10) * 10) / 10, // 10–24s
      delay: Math.round(seededRandom(i * 17) * 18 * 10) / 10,     // 0–18s
      wobble: Math.round(seededRandom(i * 5) * 30 + 8),           // 8–38px
      opacity: Math.round((seededRandom(i * 11) * 0.18 + 0.06) * 100) / 100, // 0.06–0.24
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: `-${b.size + 20}px`,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            // CSS custom props for the keyframe wobble
            ["--wobble" as string]: `${b.wobble}px`,
          }}
        />
      ))}
    </div>
  );
}
