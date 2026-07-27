# AI Tool Definitions: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`
**Last reconciled with codebase**: 2026-07-27

These are the AI-SDK tools registered in `src/lib/ai/tool-definitions.ts` as Zod schemas (via
`zodSchema()`), **not raw Gemini function declarations** as originally written here — this is
what lets the same tool set work unmodified across all three supported providers (Google Gemini,
Anthropic Claude, OpenAI). Each tool maps one-to-one to a Kapruka MCP tool. Whichever model is
active calls these as tools; `runOrchestrator()` (`src/lib/ai/orchestrator.ts`) intercepts the
call and executes the corresponding MCP wrapper in `src/lib/mcp/tools/`.

The JSON below has been regenerated from the actual `tool-definitions.ts` Zod schemas rather than
the original hand-written JSON Schema, which had drifted in a few real ways:

- `search_products.q` is now **optional** in the tool schema (not required) — the model is
  allowed to search by category/price filters alone.
- A `currency` parameter (`LKR | USD | GBP | AUD | CAD | EUR`) was added to `search_products`,
  `get_product`, and `create_order`.
- Tool descriptions now include explicit parallel-call guidance (e.g. "call in PARALLEL for
  multiple categories," "call PROACTIVELY" for delivery checks) that didn't exist originally.
- The Zod schemas (via `zodSchema()`) don't emit an explicit JSON-Schema `required` array the way
  hand-written JSON Schema does — required-ness is simply "no `.optional()`" on the Zod field.
  The tables below note this per-field instead.

---

## Tool: search_products

Maps to: `kapruka_search_products`

**When the model calls this**: To find products by keyword, category, or with filters (price
range, stock, sort). Description explicitly instructs the model to call this **in parallel** for
multiple distinct categories in one turn (e.g. "flowers" AND "chocolate"), to translate
Sinhala/Tanglish queries to English first, and to prefer short 1-2 word queries.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `q` | string | No | Search keyword, e.g. "birthday cake" |
| `category` | string | No | Category name filter, e.g. "Birthday", "Flowers", "Cakes" |
| `min_price` | number | No | Minimum price in the requested currency |
| `max_price` | number | No | Maximum price in the requested currency |
| `in_stock_only` | boolean | No | Exclude out-of-stock items |
| `sort` | string | No | `relevance` \| `price_asc` \| `price_desc` \| `newest` \| `bestseller` |
| `limit` | number | No | Results per page, max 50, default 10 |
| `cursor` | string | No | Pagination cursor from a previous search response |
| `currency` | enum | No | `LKR` (default) \| `USD` \| `GBP` \| `AUD` \| `CAD` \| `EUR` |

---

## Tool: get_product

Maps to: `kapruka_get_product`

**When the model calls this**: For full details on a specific product — description, variants,
images, stock level, shipping — or to confirm stock/variants before adding to cart.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `product_id` | string | Yes | Kapruka product ID, e.g. `cake00ka002034` |
| `currency` | enum | No | Match the currency used in the current session |

---

## Tool: list_categories

Maps to: `kapruka_list_categories`

**When the model calls this**: User wants to browse by category rather than search by keyword.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `depth` | number | No | `1` = top-level only, `2` = include subcategories |

---

## Tool: list_delivery_cities

Maps to: `kapruka_list_delivery_cities`

**When the model calls this**: To confirm a canonical city name before calling `check_delivery`.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `query` | string | No | Partial city name, e.g. "Kand" → "Kandy" |
| `limit` | number | No | Max results, default 25 |

---

## Tool: check_delivery

Maps to: `kapruka_check_delivery`

**When the model calls this**: To check delivery availability, cost, and estimated date for a
city. Description instructs the model to call this **proactively** (without being asked) whenever
a city is mentioned alongside a product, and notes it can be called **in parallel** with
`search_products`.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `city` | string | Yes | Canonical city name from `list_delivery_cities` |
| `delivery_date` | string | No | `YYYY-MM-DD`; defaults to today if omitted |
| `product_id` | string | No | Checks perishable warnings for cakes/flowers |

---

## Tool: create_order

Maps to: `kapruka_create_order`

**When the model calls this**: Only after all checkout fields have been collected — recipient
name, phone, delivery address, city, and date. Should be called once per checkout flow.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `cart` | array of `{ product_id: string, quantity: number, icing_text?: string }` | Yes | Items to order. Note: `quantity` is required on each cart line in the actual Zod schema (not optional as the original doc implied) |
| `recipient.name` | string | Yes | |
| `recipient.phone` | string | Yes | E.164 or SL local format (`077...`) |
| `delivery.address` | string | Yes | |
| `delivery.city` | string | Yes | |
| `delivery.date` | string | Yes | `YYYY-MM-DD` |
| `delivery.location_type` | enum | No | `apartment` \| `house` \| `office` \| `other` |
| `delivery.instructions` | string | No | |
| `sender.name` | string | Yes | |
| `sender.anonymous` | boolean | No | |
| `gift_message` | string | No | Max 300 chars |
| `currency` | enum | No | Match the currency used throughout the session |

---

## Tool: track_order

Maps to: `kapruka_track_order`

**When the model calls this**: User provides an order number to check delivery status. Uses the
order number from the confirmation email, **not** the `order_ref` returned by `create_order`.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `order_number` | string | Yes | From confirmation email, e.g. `VIMP34456CB2`, 4-40 chars |
