"use client";

import { useState, useEffect } from "react";
import type { ToolStep } from "@/types/domain";

const TOOL_LABELS: Record<string, string> = {
  search_products:      "Searching inventory",
  get_product:          "Fetching product details",
  list_categories:      "Loading categories",
  list_delivery_cities: "Loading delivery cities",
  check_delivery:       "Checking delivery options",
  create_order:         "Creating your order",
  track_order:          "Tracking your order",
  __response__:         "Preparing response",
};

function label(tool: string) {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ");
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

interface Props {
  toolSteps?: ToolStep[];
  isStreaming: boolean;
}

export function ThinkingIndicator({ toolSteps, isStreaming }: Props) {
  const hasSteps = toolSteps && toolSteps.length > 0;

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      {/* Always-visible header */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
          Kiyo is working<AnimatedDots />
        </span>
      </div>

      {/* Tool step list */}
      {hasSteps && (
        <div className="flex flex-col gap-1.5 pl-1">
          {toolSteps!.map((step, i) => (
            <div key={`${step.tool}-${i}`} className="flex items-center gap-2">
              {step.status === "done" ? (
                <span className="text-[12px] shrink-0" style={{ color: "var(--green)" }}>✓</span>
              ) : (
                <span
                  className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: "var(--purple-light)", borderTopColor: "transparent" }}
                />
              )}
              <span
                className="text-[13px]"
                style={{ color: step.status === "done" ? "var(--ink-3)" : "var(--ink-2)" }}
              >
                {label(step.tool)}
              </span>
            </div>
          ))}

          {isStreaming &&
            toolSteps!.every((s) => s.status === "done") &&
            !toolSteps!.some((s) => s.tool === "__response__") && (
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style={{ borderColor: "var(--purple-light)", borderTopColor: "transparent" }}
              />
              <span className="text-[13px]" style={{ color: "var(--ink-2)" }}>
                Preparing response…
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
