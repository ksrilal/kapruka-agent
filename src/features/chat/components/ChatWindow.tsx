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
      <div style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}>
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
