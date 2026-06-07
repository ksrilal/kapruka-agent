"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/features/chat/store";

// Glow blob that follows the cursor across the whole app —
// dialed down once a conversation is active so it doesn't compete with message bubbles
export function CursorGlow() {
  const blobRef = useRef<HTMLDivElement>(null);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    function onMove(e: MouseEvent) {
      if (!blob) return;
      blob.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={blobRef} className={`cursor-blob ${hasMessages ? "cursor-blob-dim" : ""}`} />;
}
