"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/features/chat/store";
import { useShopStore } from "@/features/shop/store";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChat } from "@/features/chat/hooks/useChat";
import { EmptyState } from "@/features/shop/components/EmptyState";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const { messages, isStreaming, retry, sendMessage } = useChat();
  const registerSendMessage = useShopStore((s) => s.registerSendMessage);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    registerSendMessage(sendMessage);
  }, [registerSendMessage, sendMessage]);

  const showChat = mounted && hasMessages;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" }}>
      {showChat ? (
        <ChatWindow messages={messages} isStreaming={isStreaming} onRetry={retry} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
