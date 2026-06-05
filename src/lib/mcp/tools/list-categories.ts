import { callMcpTool } from "../client";
import type { ListCategoriesInput } from "@/types/mcp";

export async function listCategories(input: ListCategoriesInput = {}): Promise<string> {
  return callMcpTool("kapruka_list_categories", { ...input }) as Promise<string>;
}
