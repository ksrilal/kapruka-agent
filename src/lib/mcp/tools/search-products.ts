import { callMcpTool } from "../client";
import type { SearchProductsInput } from "@/types/mcp";

function hasResults(markdown: string): boolean {
  return /LKR\s[\d,]+/.test(markdown);
}

function fallbackQueries(input: SearchProductsInput): string[] {
  const raw = (input.q?.trim() ?? "").replace(/\*/g, "").trim();
  const queries: string[] = [];

  if (raw.length >= 3) queries.push(raw);

  const STOPWORDS = new Set(["for", "the", "a", "an", "and", "or", "of", "my", "to", "in", "on", "with", "best", "top", "give", "show", "selling", "popular"]);
  const words = raw.split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase()));

  if (words.length > 1) {
    // Try removing first word (often an occasion/adjective modifier)
    const tail = words.slice(1).join(" ");
    if (tail.length >= 3) queries.push(tail);
    // Try just the last word (usually the product type)
    const last = words[words.length - 1];
    if (last.length >= 3 && last !== tail) queries.push(last);
  }

  // Fall back to category name if provided
  if (input.category && input.category.length >= 3) queries.push(input.category);

  return [...new Set(queries)];
}

export async function searchProducts(input: SearchProductsInput): Promise<string> {
  const queries = fallbackQueries(input);

  // If we have no valid queries but have a category, search by category only (no q)
  if (queries.length === 0) {
    const { q: _q, ...rest } = input;
    return callMcpTool("kapruka_search_products", { ...rest }) as Promise<string>;
  }

  for (const q of queries) {
    const result = await callMcpTool("kapruka_search_products", { ...input, q }) as string;
    if (hasResults(result)) return result;
  }

  // All queries tried — return result of broadest (last) query
  const lastQ = queries[queries.length - 1];
  return callMcpTool("kapruka_search_products", { ...input, q: lastQ }) as Promise<string>;
}
