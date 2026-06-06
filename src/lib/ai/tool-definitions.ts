import { zodSchema } from "ai";
import { z } from "zod";

// Tool definitions in Vercel AI SDK format — provider-agnostic.
// All three providers (Gemini, Claude, OpenAI) accept this shape via generateText.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const def = (description: string, schema: z.ZodTypeAny): { description: string; inputSchema: any } => ({
  description,
  inputSchema: zodSchema(schema),
});

export const aiTools = {
  search_products: def(
    "Search the Kapruka catalogue for any product — gifts, groceries, electronics, fashion, home essentials, and more. Call in PARALLEL for multiple categories (e.g. search 'flowers' AND 'chocolate' simultaneously when user is undecided). Translate Sinhala/Tanglish queries to English before searching. Use short 1-2 word queries only.",
    z.object({
      q: z.string().optional().describe("Search keyword, e.g. 'birthday cake'."),
      category: z.string().optional().describe("Category name filter, e.g. 'Birthday', 'Flowers', 'Cakes'."),
      min_price: z.number().optional().describe("Minimum price in LKR."),
      max_price: z.number().optional().describe("Maximum price in LKR."),
      in_stock_only: z.boolean().optional().describe("Set true to exclude out-of-stock items."),
      sort: z.string().optional().describe("Sort order: relevance, price_asc, price_desc, newest, bestseller."),
      limit: z.number().optional().describe("Results per page, max 50. Default 10."),
      cursor: z.string().optional().describe("Pagination cursor from previous search response."),
    })
  ),

  get_product: def(
    "Get full details for a specific Kapruka product by its ID: description, variants, images, stock level, and shipping info.",
    z.object({
      product_id: z.string().describe("Kapruka product ID, e.g. 'cake00ka002034'."),
    })
  ),

  list_categories: def(
    "List all Kapruka product categories. Use when the user wants to browse by category rather than search by keyword.",
    z.object({
      depth: z.number().optional().describe("1 for top-level only, 2 to include subcategories."),
    })
  ),

  list_delivery_cities: def(
    "Search Kapruka delivery cities by partial name. Use to confirm a city is deliverable and get its canonical name before checking delivery rates.",
    z.object({
      query: z.string().optional().describe("Partial city name to search, e.g. 'Kand' to find 'Kandy'."),
      limit: z.number().optional().describe("Max results. Default 25."),
    })
  ),

  check_delivery: def(
    "Check if Kapruka can deliver to a city on a given date, and get the delivery fee in LKR. Call PROACTIVELY — if the user mentions a city alongside a product, check delivery without being asked. Can be called in PARALLEL with search_products.",
    z.object({
      city: z.string().describe("Canonical city name from list_delivery_cities."),
      delivery_date: z.string().optional().describe("Target delivery date in YYYY-MM-DD format. Defaults to today if omitted."),
      product_id: z.string().optional().describe("Optional product ID to check perishable warnings for cakes/flowers."),
    })
  ),

  create_order: def(
    "Create a guest checkout order on Kapruka and return a payment URL. Call ONLY after collecting all required fields: recipient name, phone, delivery address, city, and date.",
    z.object({
      cart: z.array(z.object({
        product_id: z.string(),
        quantity: z.number(),
        icing_text: z.string().optional(),
      })).describe("Items to order."),
      recipient: z.object({
        name: z.string(),
        phone: z.string(),
      }),
      delivery: z.object({
        address: z.string(),
        city: z.string(),
        date: z.string(),
        location_type: z.string().optional(),
        instructions: z.string().optional(),
      }),
      sender: z.object({
        name: z.string(),
        anonymous: z.boolean().optional(),
      }),
      gift_message: z.string().optional().describe("Optional gift card message, max 300 chars."),
    })
  ),

  track_order: def(
    "Track the delivery status of a Kapruka order by its order number (from the confirmation email, e.g. VIMP34456CB2). Do not use the order reference from checkout.",
    z.object({
      order_number: z.string().describe("Order number from confirmation email. 4-40 chars."),
    })
  ),
};
