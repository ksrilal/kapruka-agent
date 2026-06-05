# AI Tool Definitions: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`

These are the Gemini function declarations registered in `src/lib/ai/tool-definitions.ts`.
Each declaration maps one-to-one to a Kapruka MCP tool. Gemini calls these as functions;
the Route Handler intercepts and executes the corresponding MCP wrapper.

---

## Function: search_products

Maps to: `kapruka_search_products`

**When Gemini calls this**: User asks to find products by keyword, category, or with filters
(price range, stock availability, sort preference).

```json
{
  "name": "search_products",
  "description": "Search the Kapruka catalogue for products matching a keyword query. Use when the user asks to find, browse, or search for products. Supports filters for category, price range, stock availability, and sorting.",
  "parameters": {
    "type": "object",
    "properties": {
      "q": {
        "type": "string",
        "description": "Search query, 3-200 chars. Translate to English if user writes in Sinhala or Tanglish before searching."
      },
      "category": {
        "type": "string",
        "description": "Category name filter, e.g. 'Birthday', 'Flowers', 'Cakes'. Use only names returned by list_categories."
      },
      "min_price": { "type": "number", "description": "Minimum price in LKR." },
      "max_price": { "type": "number", "description": "Maximum price in LKR." },
      "in_stock_only": {
        "type": "boolean",
        "description": "Set true to exclude out-of-stock items. Default false."
      },
      "sort": {
        "type": "string",
        "enum": ["relevance", "price_asc", "price_desc", "newest", "bestseller"]
      },
      "limit": {
        "type": "integer",
        "description": "Results per page, max 50. Default 10."
      },
      "cursor": {
        "type": "string",
        "description": "Pagination cursor from previous search response."
      }
    },
    "required": ["q"]
  }
}
```

---

## Function: get_product

Maps to: `kapruka_get_product`

**When Gemini calls this**: User asks for details about a specific product, or before adding
to cart to confirm stock and variant availability.

```json
{
  "name": "get_product",
  "description": "Get full details for a specific Kapruka product by its ID: description, variants, images, stock level, and shipping info.",
  "parameters": {
    "type": "object",
    "properties": {
      "product_id": {
        "type": "string",
        "description": "Kapruka product ID, e.g. 'cake00ka002034'. 3-80 chars."
      }
    },
    "required": ["product_id"]
  }
}
```

---

## Function: list_categories

Maps to: `kapruka_list_categories`

**When Gemini calls this**: User asks to browse categories or says something like "what can
I buy?" or "show me what's available".

```json
{
  "name": "list_categories",
  "description": "List all Kapruka product categories. Use when the user wants to browse by category rather than search by keyword.",
  "parameters": {
    "type": "object",
    "properties": {
      "depth": {
        "type": "integer",
        "enum": [1, 2],
        "description": "Include subcategories (depth=2) or top-level only (depth=1)."
      }
    }
  }
}
```

---

## Function: list_delivery_cities

Maps to: `kapruka_list_delivery_cities`

**When Gemini calls this**: User mentions a city name for delivery; use to confirm the
canonical city name before calling `check_delivery`.

```json
{
  "name": "list_delivery_cities",
  "description": "Search Kapruka delivery cities by partial name. Use to confirm a city is deliverable and get its canonical name before checking delivery rates.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Partial city name to search, e.g. 'Kand' to find 'Kandy'."
      },
      "limit": { "type": "integer", "description": "Max results. Default 25." }
    }
  }
}
```

---

## Function: check_delivery

Maps to: `kapruka_check_delivery`

**When Gemini calls this**: User has confirmed a delivery city and wants to know availability,
cost, and estimated date.

```json
{
  "name": "check_delivery",
  "description": "Check if Kapruka can deliver to a city on a given date, and get the delivery fee in LKR.",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "Canonical city name from list_delivery_cities."
      },
      "delivery_date": {
        "type": "string",
        "description": "Target delivery date in YYYY-MM-DD format. Defaults to today (Sri Lanka time) if omitted."
      },
      "product_id": {
        "type": "string",
        "description": "Optional: product ID to check perishable warnings for cakes/flowers."
      }
    },
    "required": ["city"]
  }
}
```

---

## Function: create_order

Maps to: `kapruka_create_order`

**When Gemini calls this**: All checkout fields have been collected and validated. Gemini
MUST call this only once per checkout flow. The Route Handler validates all inputs against
Zod schemas before forwarding to MCP.

```json
{
  "name": "create_order",
  "description": "Create a guest checkout order on Kapruka and return a payment URL. Call ONLY after collecting all required fields: recipient name, phone, delivery address, city, and date.",
  "parameters": {
    "type": "object",
    "properties": {
      "cart": {
        "type": "array",
        "description": "Items to order.",
        "items": {
          "type": "object",
          "properties": {
            "product_id": { "type": "string" },
            "quantity": { "type": "integer" },
            "icing_text": {
              "type": "string",
              "description": "Cake icing text, max 120 chars."
            }
          },
          "required": ["product_id"]
        }
      },
      "recipient": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "phone": {
            "type": "string",
            "description": "E.164 or SL local format (077...)."
          }
        },
        "required": ["name", "phone"]
      },
      "delivery": {
        "type": "object",
        "properties": {
          "address": { "type": "string" },
          "city": { "type": "string" },
          "date": { "type": "string", "description": "YYYY-MM-DD format." },
          "location_type": {
            "type": "string",
            "enum": ["house", "apartment", "office", "other"]
          },
          "instructions": { "type": "string" }
        },
        "required": ["address", "city", "date"]
      },
      "sender": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "anonymous": { "type": "boolean" }
        },
        "required": ["name"]
      },
      "gift_message": {
        "type": "string",
        "description": "Optional gift card message, max 300 chars."
      }
    },
    "required": ["cart", "recipient", "delivery", "sender"]
  }
}
```

---

## Function: track_order

Maps to: `kapruka_track_order`

**When Gemini calls this**: User provides an order number to check delivery status.
Note: uses the order number from the confirmation email, NOT the `order_ref` from checkout.

```json
{
  "name": "track_order",
  "description": "Track the delivery status of a Kapruka order by its order number (from the confirmation email, e.g. VIMP34456CB2). Do not use the order reference from checkout.",
  "parameters": {
    "type": "object",
    "properties": {
      "order_number": {
        "type": "string",
        "description": "Order number from confirmation email. 4-40 chars."
      }
    },
    "required": ["order_number"]
  }
}
```
