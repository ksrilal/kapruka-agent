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
      min_price: z.number().optional().describe("Minimum price in the requested currency."),
      max_price: z.number().optional().describe("Maximum price in the requested currency."),
      in_stock_only: z.boolean().optional().describe("Set true to exclude out-of-stock items."),
      sort: z.string().optional().describe("Sort order: relevance, price_asc, price_desc, newest, bestseller."),
      limit: z.number().optional().describe("Results per page, max 50. Default 10."),
      cursor: z.string().optional().describe("Pagination cursor from previous search response."),
      currency: z.enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"]).optional().describe("Currency for returned prices. Default LKR. Use when user requests prices in a specific currency."),
    })
  ),

  get_product: def(
    "Get full details for a specific Kapruka product by its ID: description, variants, images, stock level, and shipping info.",
    z.object({
      product_id: z.string().describe("Kapruka product ID, e.g. 'cake00ka002034'."),
      currency: z.enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"]).optional().describe("Currency for returned prices. Match the currency used in the current session."),
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
        location_type: z.enum(["apartment", "house", "office", "other"]).optional().describe("Type of delivery location."),
        instructions: z.string().optional(),
      }),
      sender: z.object({
        name: z.string(),
        anonymous: z.boolean().optional(),
      }),
      gift_message: z.string().optional().describe("Optional gift card message, max 300 chars."),
      currency: z.enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"]).optional().describe("Currency for the order total. Match the currency used throughout the session."),
    })
  ),

  track_order: def(
    "Track the delivery status of a Kapruka order by its order number (from the confirmation email, e.g. VIMP34456CB2). Do not use the order reference from checkout.",
    z.object({
      order_number: z.string().describe("Order number from confirmation email. 4-40 chars."),
    })
  ),

  get_order_history: def(
    "Get the signed-in customer's past orders — beyond what's already summarized in your account context. Use for questions like 'what did I order last month' or when you need more than the 5 most recent orders already shown to you. No parameters take an email — this always looks up the current signed-in customer, nobody else.",
    z.object({
      limit: z.number().optional().describe("Max orders to return. Default 5."),
    })
  ),

  get_customer_addresses: def(
    "Get the signed-in customer's full saved address book — beyond what's already summarized in your account context. Use when you need more than the 5 addresses already shown to you, or to double-check an exact saved address before checkout. Always looks up the current signed-in customer, nobody else.",
    z.object({})
  ),

  get_customer_details: def(
    "Refresh or double-check the signed-in customer's own profile details (name, phone, email) — beyond what's already summarized in your account context. Use for questions like 'what's my phone number on file' or if the account context looks stale. No parameters take an email — this always looks up the current signed-in customer, nobody else.",
    z.object({})
  ),
};

// Subset offered when nobody is signed in — these account-scoped tools have no
// email parameter (by design, so the model can never guess/loop through
// emails), so they're useless without a session and are left out entirely
// rather than exposed to fail every time.
const ACCOUNT_SCOPED_TOOLS = new Set(["get_order_history", "get_customer_addresses", "get_customer_details"]);
export const guestTools = Object.fromEntries(
  Object.entries(aiTools).filter(([name]) => !ACCOUNT_SCOPED_TOOLS.has(name))
) as typeof aiTools;
