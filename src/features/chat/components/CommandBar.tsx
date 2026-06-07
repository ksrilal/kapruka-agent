"use client";

import {
  useState, useRef, useEffect,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Square, Mic, MicOff } from "lucide-react";
import { KiyoAvatar } from "@/components/ui/KiyoAvatar";
import { useShopStore } from "@/features/shop/store";
import { useChat } from "@/features/chat/hooks/useChat";
import { useChatStore } from "@/features/chat/store";

// Rotating placeholder text — mix of English, Sinhala, and Tanglish
const PROMPTS = [
  { text: "Ask anything...",            lang: "EN" },
  { text: "Ona deyak ahanna...",        lang: "TGL" },
  { text: "ඕන දෙයක් අහන්න...",          lang: "සිං" },
  { text: "Ethaiyum kaelungal...",      lang: "TGL" },
];

const LANG_META: Record<string, { label: string; color: string; bg: string }> = {
  en: {
    label: "EN",
    color: "var(--ink-3)",
    bg: "var(--surface-2)",
  },
  si: {
    label: "සිං",
    color: "var(--purple-light)",
    bg: "var(--purple-soft)",
  },
  "ta-Latn": {
    label: "TGL",
    color: "var(--accent)",
    bg: "var(--accent-soft)",
  },
};

export function CommandBar() {
  const [value, setValue] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const commandOpen = useShopStore((s) => s.commandOpen);
  const openCommand = useShopStore((s) => s.openCommand);
  const setSearchRef = useShopStore((s) => s.setSearchRef);
  const { isStreaming, sendMessage, stop, locale } = useChat();
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  useEffect(() => {
    setSearchRef(textareaRef as React.RefObject<HTMLTextAreaElement | null>);
  }, [setSearchRef]);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % PROMPTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(
      typeof window !== "undefined" &&
      (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)
    );
  }, []);

  // Refocus textarea when AI finishes responding so user can type immediately
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommand();
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCommand]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function startListening() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    // Use detected locale for voice too
    r.lang = locale === "si" ? "si-LK" : locale === "ta-Latn" ? "ta-LK" : "en-US";
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (ev: SpeechRecognitionEvent) => {
      const t = ev.results[0]?.[0]?.transcript;
      if (t) { setValue((v) => (v ? `${v} ${t}` : t)); autoResize(); }
    };
    recognitionRef.current = r;
    r.start();
  }

  const currentPrompt = PROMPTS[promptIdx % PROMPTS.length];
  const langMeta = hasMessages ? LANG_META[locale] ?? LANG_META.en : null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex flex-col items-center px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-none">
      <div className="w-full max-w-3xl pointer-events-auto">

        <div
          className={`command-bar rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
            commandOpen ? "ring-1 ring-(--purple)/40" : ""
          }`}
        >
          <div className="flex items-end gap-3">
            {/* Kiyo avatar */}
            <KiyoAvatar size={32} className="mb-0.5" />

            {/* Textarea + language pill */}
            <div className="flex-1 min-w-0">
              {isStreaming && !value ? (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease_infinite]" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease_infinite]" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[pulse_1s_ease_infinite]" style={{ animationDelay: "300ms" }} />
                  <span className="t-small text-muted-foreground ml-1">Kiyo is thinking&hellip;</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); autoResize(); }}
                    onKeyDown={handleKey}
                    onFocus={openCommand}
                    placeholder={currentPrompt?.text ?? "Ask anything"}
                    disabled={isStreaming}
                    className="flex-1 min-w-0 resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-0"
                    style={{ maxHeight: 120, caretColor: "var(--purple-light)" }}
                  />
                  {/* Detected language pill — only show when conversation is active */}
                  {langMeta && (
                    <span
                      className="shrink-0 self-center rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
                      style={{
                        background: langMeta.bg,
                        color: langMeta.color,
                        border: `1px solid ${langMeta.color}33`,
                      }}
                      title="Detected language"
                    >
                      {langMeta.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {speechSupported && (
                <button
                  onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                  title={isListening ? "Stop recording" : "Voice input"}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    isListening
                      ? "bg-primary text-white shadow-[0_0_0_4px_var(--purple-soft)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-(--surface-2)"
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}

              {isStreaming ? (
                <button
                  onClick={stop}
                  title="Stop"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--surface-2) text-foreground transition-all hover:bg-(--border-2) active:scale-95"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!value.trim()}
                  title="Send"
                  className="btn-purple flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-30 disabled:shadow-none active:scale-95"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Placeholder language hint — only on empty state */}
          {!hasMessages && !value && (
            <div className="mt-2 flex justify-center">
            <div
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 flex-wrap w-fit"
              style={{ background: "var(--surface-2)" }}
            >
              <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>Type in</span>
              {[
                { label: "English", color: "var(--ink-3)" },
                { label: "සිංහල",  color: "var(--purple-light)" },
                { label: "Tanglish", color: "var(--accent)" },
              ].map(({ label, color }, i, arr) => (
                <span key={label}>
                  <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
                  {i < arr.length - 1 && <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>, </span>}
                </span>
              ))}
              <span className="hidden sm:inline text-[11px]" style={{ color: "var(--ink-3)" }}>— Kiyo understands all three</span>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
