"use client";

import { KiyoAvatar } from "@/components/ui/KiyoAvatar";
import { ProductCarousel } from "@/features/products/components/ProductCarousel";
import { OrderCard, OrderStatusCard } from "./OrderCard";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { renderMarkdown } from "@/lib/utils/markdown";
import type { ConversationMessage } from "@/types/domain";

interface ChatBubbleProps {
  message: ConversationMessage;
  onRetry?: (id: string) => void;
  isStreaming?: boolean;
}

export function ChatBubble({ message, onRetry, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div
          className="max-w-[88%] sm:max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] leading-relaxed text-white"
          style={{ background: "linear-gradient(135deg, var(--purple) 0%, var(--purple-hover) 100%)", boxShadow: "0 4px 20px var(--purple-glow)" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — full width column
  return (
    <div className="flex gap-3 w-full animate-fade-up">
      <KiyoAvatar size={32} className="mt-1" />

      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Error */}
        {message.isError ? (
          <p className="text-[14px] pt-1" style={{ color: "var(--ink-2)" }}>
            Something went wrong.{" "}
            {message.retryable && onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className="underline underline-offset-2 transition-colors hover:text-foreground"
                style={{ color: "var(--purple-light)" }}
              >
                Try again
              </button>
            )}
          </p>
        ) : isStreaming && !message.content ? (
          <ThinkingIndicator toolSteps={message.toolSteps} isStreaming={isStreaming} />
        ) : message.content ? (
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
            }}
          >
            <div className="space-y-2">{renderMarkdown(message.content)}</div>
          </div>
        ) : null}

        {/* Product carousel — full width, breaks out of text bubble */}
        {message.products && message.products.length > 0 && (
          <ProductCarousel products={message.products} />
        )}

        {/* Order checkout card */}
        {message.order && <OrderCard order={message.order} />}

        {/* Order tracking card */}
        {message.orderStatus && <OrderStatusCard status={message.orderStatus} />}
      </div>
    </div>
  );
}

