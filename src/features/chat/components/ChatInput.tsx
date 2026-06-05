"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { VoiceButton } from "./VoiceButton";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  placeholder = "Ask me anything — gifts, cakes, flowers...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  const hasValue = value.trim().length > 0;

  return (
    <div className="sticky bottom-0 px-4 pb-6 pt-3">
      <form
        onSubmit={(e: FormEvent) => { e.preventDefault(); submit(); }}
        className="glass mx-auto flex max-w-(--chat-max) items-end gap-2 rounded-2xl px-3 py-3"
      >
        <VoiceButton
          onTranscript={(t) => {
            setValue((v) => (v ? `${v} ${t}` : t));
            textareaRef.current?.focus();
          }}
          disabled={isStreaming}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-(--text-primary) outline-none placeholder:text-muted-foreground disabled:opacity-50"
          style={{ maxHeight: 140 }}
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-border"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!hasValue}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-(--shadow-sm) transition-all hover:bg-(--primary-hover) active:scale-95 disabled:opacity-30 disabled:shadow-none"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
