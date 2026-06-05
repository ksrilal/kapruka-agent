"use client";

import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { ConversationMessage } from "@/types/domain";

interface Props {
  messages: ConversationMessage[];
  isStreaming: boolean;
  onClose: () => void;
}

export function ChatHistoryPanel({ messages, isStreaming, onClose }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const lastMsg = messages[messages.length - 1];
  const showDots =
    isStreaming && lastMsg?.role === "assistant" && !lastMsg.content && !lastMsg.isError;

  return (
    <div className="glass rounded-2xl shadow-[var(--s4)] overflow-hidden anim-scale-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <span className="t-micro text-[var(--ink-3)]">Conversation</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {!isUser && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--red)] text-[10px] font-bold text-white mt-0.5">
                  K
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  isUser
                    ? "bg-[var(--red)] text-white"
                    : msg.isError
                    ? "border border-red-300/40 bg-red-500/10 text-red-400"
                    : "bg-[var(--bg-2)] text-[var(--ink)]"
                }`}
              >
                {msg.isError ? "Something went wrong. Try again." : msg.content}
              </div>
            </div>
          );
        })}
        {showDots && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--red)] text-[10px] font-bold text-white">K</div>
            <div className="flex items-center gap-1 rounded-2xl bg-[var(--bg-2)] px-3 py-2">
              {[0,150,300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 rounded-full bg-[var(--ink-3)] animate-[pulse_1s_ease_infinite]" style={{animationDelay:`${d}ms`}} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
