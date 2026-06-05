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
    <div className="flex flex-col items-center flex-1 overflow-y-auto w-full">
      <div className="w-full px-4 sm:px-10 lg:px-50 py-6 sm:py-8 flex flex-col gap-6">
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
