import type { ChatSSEEvent } from "@/types/ai";

export function encodeSSE(event: ChatSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createSSEStream(
  generator: AsyncGenerator<ChatSSEEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        }
      } finally {
        controller.close();
      }
    },
  });
}
