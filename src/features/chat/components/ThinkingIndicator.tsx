"use client";

import { useState, useEffect, useRef } from "react";
import type { ToolStep } from "@/types/domain";

// Static label shown once the step is done (checkmark row)
const DONE_LABELS: Record<string, string> = {
  search_products:      "Searched Kapruka catalog",
  get_product:          "Fetched product details",
  list_categories:      "Loaded categories",
  list_delivery_cities: "Loaded delivery cities",
  check_delivery:       "Checked delivery",
  create_order:         "Order created",
  track_order:          "Order tracked",
  __response__:         "Response ready",
};

// Rotating messages shown while the tool is running — cycles every 2.5 s
const RUNNING_MESSAGES: Record<string, string[]> = {
  search_products: [
    "🔍 Searching Kapruka's catalog...",
    "🛍️ Looking through products...",
    "✨ Picking the best matches...",
    "📦 Checking what's in stock...",
  ],
  get_product: [
    "🔎 Fetching product details...",
    "📋 Loading full product info...",
  ],
  list_categories: [
    "📂 Loading categories...",
    "🗂️ Browsing what Kapruka offers...",
  ],
  list_delivery_cities: [
    "🗺️ Loading delivery cities...",
    "📍 Checking coverage areas...",
  ],
  check_delivery: [
    "🚚 Checking delivery availability...",
    "📍 Verifying your city...",
    "⏱️ Checking delivery timing...",
    "💰 Looking up delivery fees...",
  ],
  create_order: [
    "🛒 Placing your order...",
    "📝 Filling in order details...",
    "⚡ Almost done...",
  ],
  track_order: [
    "📦 Tracking your order...",
    "🔄 Fetching latest status...",
  ],
  __response__: [
    "✨ Picking the best recommendations...",
    "💬 Putting it all together...",
    "🤔 Thinking through options...",
  ],
};

const FALLBACK_RUNNING = ["⚙️ Working on it...", "⏳ One moment..."];

function getRunningMessages(tool: string): string[] {
  return RUNNING_MESSAGES[tool] ?? FALLBACK_RUNNING;
}

function doneLabel(tool: string) {
  return DONE_LABELS[tool] ?? tool.replace(/_/g, " ");
}

// Cycles through messages at a fixed interval while mounted
function useRotatingMessage(messages: string[], intervalMs = 2500): string {
  const [idx, setIdx] = useState(0);
  const lenRef = useRef(messages.length);

  useEffect(() => {
    lenRef.current = messages.length;
  });

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % lenRef.current), intervalMs);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return messages[idx % messages.length] ?? messages[0];
}

function AnimatedDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ color: "var(--purple-light)" }}>
      {".".repeat(dots)}
      <span style={{ opacity: 0 }}>{".".repeat(3 - dots)}</span>
    </span>
  );
}

// Single running step row — isolated so each tool has its own rotation cycle
function RunningRow({ tool }: { tool: string }) {
  const messages = getRunningMessages(tool);
  const message = useRotatingMessage(messages);
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
        style={{ borderColor: "var(--purple-light)", borderTopColor: "transparent" }}
      />
      <span className="text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
        {message}
      </span>
    </div>
  );
}

function DoneRow({ tool }: { tool: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12px] shrink-0" style={{ color: "var(--green)" }}>✓</span>
      <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
        {doneLabel(tool)}
      </span>
    </div>
  );
}

interface Props {
  toolSteps?: ToolStep[];
  isStreaming: boolean;
}

export function ThinkingIndicator({ toolSteps, isStreaming }: Props) {
  const hasSteps = toolSteps && toolSteps.length > 0;
  const allDone = hasSteps && toolSteps!.every((s) => s.status === "done");
  const hasResponseStep = hasSteps && toolSteps!.some((s) => s.tool === "__response__");

  // Show synthesis row when all tools are done but no __response__ step yet
  const showSynthesis = isStreaming && allDone && !hasResponseStep;

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      {/* Header — only show if no steps yet */}
      {!hasSteps && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
            Kiyo is working<AnimatedDots />
          </span>
        </div>
      )}

      {/* Tool step list */}
      {hasSteps && (
        <div className="flex flex-col gap-2 pl-0.5">
          {toolSteps!.map((step, i) =>
            step.status === "done"
              ? <DoneRow key={`${step.tool}-${i}`} tool={step.tool} />
              : <RunningRow key={`${step.tool}-${i}`} tool={step.tool} />
          )}

          {showSynthesis && (
            <RunningRow tool="__response__" />
          )}
        </div>
      )}
    </div>
  );
}
