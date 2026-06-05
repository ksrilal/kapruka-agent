import { SchemaType, type Tool } from "@google/generative-ai";

export const geminiToolDeclarations: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_products",
        description:
          "Search the Kapruka catalogue for any product — gifts, groceries, electronics, fashion, home essentials, and more. Call in PARALLEL for multiple categories (e.g. search 'flowers' AND 'chocolate' simultaneously when user is undecided). Translate Sinhala/Tanglish queries to English before searching. Use short 1-2 word queries only.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            q: {
              type: SchemaType.STRING,
              description: "Search keyword, e.g. 'birthday cake'. Optional if category is provided.",
            },
            category: {
              type: SchemaType.STRING,
              description:
                "Category name filter, e.g. 'Birthday', 'Flowers', 'Cakes'.",
            },
            min_price: {
              type: SchemaType.NUMBER,
              description: "Minimum price in LKR.",
            },
            max_price: {
              type: SchemaType.NUMBER,
              description: "Maximum price in LKR.",
            },
            in_stock_only: {
              type: SchemaType.BOOLEAN,
              description: "Set true to exclude out-of-stock items.",
            },
            sort: {
              type: SchemaType.STRING,
              description:
                "Sort order: relevance, price_asc, price_desc, newest, bestseller.",
            },
            limit: {
              type: SchemaType.NUMBER,
              description: "Results per page, max 50. Default 10.",
            },
            cursor: {
              type: SchemaType.STRING,
              description: "Pagination cursor from previous search response.",
            },
          },
          required: [],
        },
      },
      {
        name: "get_product",
        description:
          "Get full details for a specific Kapruka product by its ID: description, variants, images, stock level, and shipping info.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            product_id: {
              type: SchemaType.STRING,
              description: "Kapruka product ID, e.g. 'cake00ka002034'.",
            },
          },
          required: ["product_id"],
        },
      },
      {
        name: "list_categories",
        description:
          "List all Kapruka product categories. Use when the user wants to browse by category rather than search by keyword.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            depth: {
              type: SchemaType.NUMBER,
              description:
                "1 for top-level only, 2 to include subcategories.",
            },
          },
        },
      },
      {
        name: "list_delivery_cities",
        description:
          "Search Kapruka delivery cities by partial name. Use to confirm a city is deliverable and get its canonical name before checking delivery rates.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description:
                "Partial city name to search, e.g. 'Kand' to find 'Kandy'.",
            },
            limit: {
              type: SchemaType.NUMBER,
              description: "Max results. Default 25.",
            },
          },
        },
      },
      {
        name: "check_delivery",
        description:
          "Check if Kapruka can deliver to a city on a given date, and get the delivery fee in LKR. Call PROACTIVELY — if the user mentions a city alongside a product, check delivery without being asked. Can be called in PARALLEL with search_products.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: {
              type: SchemaType.STRING,
              description: "Canonical city name from list_delivery_cities.",
            },
            delivery_date: {
              type: SchemaType.STRING,
              description:
                "Target delivery date in YYYY-MM-DD format. Defaults to today if omitted.",
            },
            product_id: {
              type: SchemaType.STRING,
              description:
                "Optional product ID to check perishable warnings for cakes/flowers.",
            },
          },
          required: ["city"],
        },
      },
      {
        name: "create_order",
        description:
          "Create a guest checkout order on Kapruka and return a payment URL. Call ONLY after collecting all required fields: recipient name, phone, delivery address, city, and date.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            cart: {
              type: SchemaType.ARRAY,
              description: "Items to order.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  product_id: { type: SchemaType.STRING },
                  quantity: { type: SchemaType.NUMBER },
                  icing_text: { type: SchemaType.STRING },
                },
              },
            },
            recipient: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
              },
            },
            delivery: {
              type: SchemaType.OBJECT,
              properties: {
                address: { type: SchemaType.STRING },
                city: { type: SchemaType.STRING },
                date: { type: SchemaType.STRING },
                location_type: { type: SchemaType.STRING },
                instructions: { type: SchemaType.STRING },
              },
            },
            sender: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                anonymous: { type: SchemaType.BOOLEAN },
              },
            },
            gift_message: {
              type: SchemaType.STRING,
              description: "Optional gift card message, max 300 chars.",
            },
          },
          required: ["cart", "recipient", "delivery", "sender"],
        },
      },
      {
        name: "track_order",
        description:
          "Track the delivery status of a Kapruka order by its order number (from the confirmation email, e.g. VIMP34456CB2). Do not use the order reference from checkout.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            order_number: {
              type: SchemaType.STRING,
              description:
                "Order number from confirmation email. 4-40 chars.",
            },
          },
          required: ["order_number"],
        },
      },
    ],
  },
];
