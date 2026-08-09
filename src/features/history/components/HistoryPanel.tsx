"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, History, Trash2, MessageSquare, Clock, ChevronRight, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHistoryStore } from "@/features/history/store";
import { useChatStore } from "@/features/chat/store";
import { useShopStore } from "@/features/shop/store";
import { usePanelEscape } from "@/lib/hooks/usePanelEscape";
import type { SavedSession } from "@/features/history/store";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CARD_ACCENTS = [
  { border: "var(--purple)", glow: "var(--purple-glow)", bg: "var(--purple-soft)", icon: "var(--purple-light)" },
  { border: "var(--accent)",  glow: "rgba(245,158,11,0.15)", bg: "var(--accent-soft)",  icon: "var(--accent)" },
  { border: "#ec4899",        glow: "rgba(236,72,153,0.15)", bg: "rgba(236,72,153,0.08)", icon: "#ec4899" },
  { border: "#10b981",        glow: "rgba(16,185,129,0.15)", bg: "rgba(16,185,129,0.08)", icon: "#10b981" },
  { border: "#06b6d4",        glow: "rgba(6,182,212,0.15)",  bg: "rgba(6,182,212,0.08)",  icon: "#06b6d4" },
];

function SessionCard({ session, index, onRestore, onDelete }: {
  session: SavedSession;
  index: number;
  onRestore: (s: SavedSession) => void;
  onDelete: (id: string) => void;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group rounded-2xl p-4 cursor-pointer transition-all duration-200"
      style={{
        background: hovered ? accent.bg : "var(--surface)",
        border: `1px solid ${hovered ? accent.border : "var(--border-2)"}`,
        boxShadow: hovered ? `0 4px 24px ${accent.glow}` : "none",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onRestore(session)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: accent.bg, border: `1px solid ${accent.border}33` }}
        >
          <MessageSquare className="h-4 w-4" style={{ color: accent.icon }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <p
            className="text-[13px] font-semibold leading-snug line-clamp-1"
            style={{ color: "var(--ink)" }}
          >
            {session.title}
          </p>

          {/* Preview */}
          {session.preview && (
            <p
              className="mt-1 text-[12px] leading-snug line-clamp-2"
              style={{ color: "var(--ink-2)" }}
            >
              {session.preview}
            </p>
          )}

          {/* Meta row — delete lives here, never overlaps the chevron */}
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
              <Clock className="h-3 w-3" />
              {timeAgo(session.savedAt)}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
              <MessageSquare className="h-3 w-3" />
              {session.messageCount} messages
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-all"
                  style={{ color: hovered ? "var(--ink-3)" : "var(--ink-3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-3)")}
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete session</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: accent.icon, opacity: hovered ? 1 : 0.3 }}
        />
      </div>
    </div>
  );
}

export function HistoryPanel() {
  const isOpen = useHistoryStore((s) => s.isOpen);
  const close = useHistoryStore((s) => s.close);
  const sessions = useHistoryStore((s) => s.sessions);
  const deleteSession = useHistoryStore((s) => s.deleteSession);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  usePanelEscape(isOpen, close);

  if (!isOpen) return null;

  const displaySessions = mounted ? sessions : [];

  function handleRestore(session: SavedSession) {
    // Load the session messages back into chat store
    useChatStore.setState({ messages: session.messages, isStreaming: false });
    // Scroll to latest after mount
    useShopStore.getState().focusSearch();
    close();
    // Restoring a session always means viewing it in the chat — if we're on a
    // static page (About, Q&A, etc.) navigate home so the user actually sees it
    router.push("/");
  }

  return (
    <>
      <div className="backdrop" onClick={close} style={{ zIndex: 70 }} />

      <aside role="dialog" aria-modal="true" aria-label="Chat History" className="cart-panel glass-dark anim-slide-left flex flex-col" style={{ zIndex: 80 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <div>
            <h2 className="t-title" style={{ color: "var(--ink)" }}>Chat History</h2>
            <p className="t-small mt-0.5" style={{ color: "var(--ink-2)" }}>
              {displaySessions.length === 0
                ? "No saved sessions"
                : `${displaySessions.length} recent session${displaySessions.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {displaySessions.length > 0 && (
              <button
                onClick={clearAll}
                className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:text-foreground"
                style={{ color: "var(--ink-3)", border: "1px solid var(--border)" }}
              >
                Clear all
              </button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={close}
                  aria-label="Close chat history"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:scale-95"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink-2)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {displaySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--surface-2)" }}
              >
                <History className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <p className="t-body font-semibold" style={{ color: "var(--ink)" }}>No history yet</p>
                <p className="t-small mt-1 max-w-55" style={{ color: "var(--ink-2)" }}>
                  Your last 5 conversations will appear here after you start a new chat.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displaySessions.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  onRestore={handleRestore}
                  onDelete={deleteSession}
                />
              ))}

              <p className="mt-2 text-center text-[11px]" style={{ color: "var(--ink-3)" }}>
                Tap a card to restore that conversation
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-6 py-4 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-2)" }}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--purple-light)" }} />
          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span className="font-kiyo">KI<span className="gradient-text">YO</span></span> saves up to 20 recent sessions automatically
          </p>
        </div>
      </aside>
    </>
  );
}
