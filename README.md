# Kiyo — Kapruka Shopping Assistant

Kiyo is a conversational AI shopping assistant for [Kapruka](https://www.kapruka.com), built on
Next.js. There is no owned product/order database — all catalog, delivery, and order data comes
from the external **Kapruka MCP** server; the app itself is a thin, stateful-on-the-client chat
front end.

See [specs/001-ai-shopping-assistant/](specs/001-ai-shopping-assistant/) for the full spec, plan,
data model, and API contracts (kept in sync with the code as of 2026-07-27), and
[DEPLOYMENT.md](DEPLOYMENT.md) for environment variables and deploy steps.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the chat UI is the home page; there is no
separate `/chat` route.

You'll need an API key for at least one AI provider in `.env.local`:

```bash
GOOGLE_API_KEY=your_google_api_key_here
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
```

By default the app uses Google Gemini. Set `AI_PROVIDER=anthropic` or `AI_PROVIDER=openai` (with
the matching `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`) to use a different provider instead — see
[DEPLOYMENT.md](DEPLOYMENT.md) for the full list of env vars.

## What's actually implemented

- **Conversational product discovery, cart, delivery check, guest checkout, and order tracking** —
  all inside one chat interface (`src/app/page.tsx`), with an AI orchestration layer
  (`src/lib/ai/orchestrator.ts`) that supports Google Gemini, Anthropic Claude, or OpenAI.
- **No database, no authentication** — all client state (cart, orders, chat history, theme) is
  Zustand-managed and persisted to `sessionStorage`/`localStorage` in the browser.
- **Voice input** (Web Speech API) — voice output/TTS is not implemented.
- **Light/dark theme**, **chat history** (last 5 sessions), and an **Orders panel** with status
  polling — none of these were in the original spec, but all are real and shipped.

Not implemented despite being planned at some point: `next-intl` UI translation (chat responses
are multilingual via the AI itself; static UI chrome is English-only), gift bundle grouping, and
any automated accessibility/performance test gates. See
[specs/001-ai-shopping-assistant/spec.md](specs/001-ai-shopping-assistant/spec.md) for the full
list of what's implemented vs. deferred.

## Learn More

This app uses Next.js — to learn more, see the
[Next.js Documentation](https://nextjs.org/docs).

## Deploy on Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for required environment variables and rate-limit notes before
deploying.
