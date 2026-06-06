import {
  GoogleGenerativeAI,
  type GenerateContentResult,
  type FunctionCall,
} from "@google/generative-ai";
import { buildSystemPrompt } from "./system-prompt";
import { geminiToolDeclarations } from "./tool-definitions";
import {
  searchProducts,
  getProduct,
  listCategories,
  listDeliveryCities,
  checkDelivery,
  createOrder,
  trackOrder,
} from "@/lib/mcp";
import type { Locale } from "@/types/domain";

const MODEL_NAME = process.env.GEMINI_MODEL ?? "models/gemini-3.5-flash";

export interface OrchestratorMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface OrchestratorResult {
  text: string;
  embedded: unknown[];
}

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "search_products":
      return searchProducts(args as never);
    case "get_product":
      return getProduct(args as never);
    case "list_categories":
      return listCategories(args as never);
    case "list_delivery_cities":
      return listDeliveryCities(args as never);
    case "check_delivery":
      return checkDelivery(args as never);
    case "create_order":
      return createOrder(args as never);
    case "track_order":
      return trackOrder(args as never);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function runOrchestrator(
  messages: OrchestratorMessage[],
  locale: Locale,
  onToolCall?: (tool: string, status: "running" | "done") => void
): Promise<OrchestratorResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: buildSystemPrompt(locale),
    tools: geminiToolDeclarations,
  });

  const chat = model.startChat({ history: messages.slice(0, -1) });
  const lastMessage = messages[messages.length - 1];
  const userText =
    lastMessage.parts.map((p) => p.text).join("") ?? "";

  let result: GenerateContentResult = await chat.sendMessage(userText);
  const embedded: unknown[] = [];

  // Handle tool call loop (up to 4 rounds — most flows need 1-2, delivery needs 3)
  for (let round = 0; round < 4; round++) {
    const candidate = result.response.candidates?.[0];
    const functionCalls = candidate?.content?.parts
      ?.filter((p) => p.functionCall)
      .map((p) => p.functionCall as FunctionCall);

    if (!functionCalls || functionCalls.length === 0) break;

    const toolResults = await Promise.all(
      functionCalls.map(async (fc) => {
        onToolCall?.(fc.name, "running");
        const toolResult = await executeTool(
          fc.name,
          fc.args as Record<string, unknown>
        );
        onToolCall?.(fc.name, "done");
        embedded.push(toolResult);
        return {
          functionResponse: {
            name: fc.name,
            response: { result: toolResult },
          },
        };
      })
    );

    result = await chat.sendMessage(toolResults);
  }

  const text = result.response.text();
  return { text, embedded };
}
