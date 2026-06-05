"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import type { ConversationMessage } from "@/types/domain";

interface ChatWindowProps {
  messages: ConversationMessage[];
  isStreaming: boolean;
  onRetry: (id: string) => void;
}

export function ChatWindow({ messages, isStreaming, onRetry }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  const lastMsgId = messages[messages.length - 1]?.id;

  return (
    <div style={{ flex: 1, overflowY: "auto", width: "100%" }}>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onRetry={onRetry}
            isStreaming={isStreaming && msg.id === lastMsgId}
          />
        ))}
        <div ref={bottomRef} style={{ height: "0.5rem" }} />
      </div>
    </div>
  );
}
