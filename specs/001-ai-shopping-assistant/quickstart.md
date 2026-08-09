# Quickstart: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`
**Last verified against code**: 2026-07-27

> This project already exists and is checked into this repo — the bootstrap steps below (1–2)
> are historical record of how it was originally created, not something you need to re-run. To
> work on the existing codebase, skip to step 3.

## Prerequisites

- Node.js 20 LTS
- npm (repo uses `package-lock.json`, not pnpm/yarn)
- An API key for at least one AI provider — Google Gemini (`GOOGLE_API_KEY`, default), Anthropic
  (`ANTHROPIC_API_KEY`), or OpenAI (`OPENAI_API_KEY`)
- Git

## 1. Bootstrap the Next.js project (historical — already done)

```bash
npx create-next-app@latest kapruka-agent \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd kapruka-agent
```

## 2. Install dependencies (historical — already in package.json)

```bash
# Core
npm install ai @ai-sdk/google @ai-sdk/anthropic @ai-sdk/openai zod zustand

# UI
npm install @radix-ui/react-dialog @radix-ui/react-scroll-area @radix-ui/react-separator \
  @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react sonner

# shadcn/ui CLI (initialised; only button + sonner primitives actually generated so far)
npx shadcn@latest init
npx shadcn@latest add button sonner

# Dev
npm install -D @next/bundle-analyzer @types/node vitest @playwright/test
```

Note: `next-intl` was originally planned but was never installed — do not add it without also
wiring up the `src/lib/i18n/` message files, which currently sit unused.

## 3. Environment variables

Create `.env.local` (gitignored):

```bash
GOOGLE_API_KEY=your_google_api_key_here
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
```

To use a different provider instead, set `AI_PROVIDER=anthropic` (with `ANTHROPIC_API_KEY`) or
`AI_PROVIDER=openai` (with `OPENAI_API_KEY`). See DEPLOYMENT.md for the full env var reference.

## 4. Verify MCP connectivity

```bash
# Quick connectivity check
curl -I -H "Accept: application/json, text/event-stream" -X POST https://mcp.kapruka.com/mcp
```

## 5. Run development server

```bash
npm run dev
# Open http://localhost:3000
```

## 6. Validate the happy path

1. Open the app at `http://localhost:3000`
2. Type: **"I'm looking for a birthday cake under 3000 rupees"**
3. Verify: product cards appear with images, names, and prices
4. Click **"Add to Cart"** on one product
5. Type: **"deliver to Kandy"**
6. Verify: delivery fee and date are shown
7. Complete the guest checkout fields when prompted
8. Verify: a payment URL and order reference appear

## 7. Validate Sinhala + Tanglish

1. Type: **"amma laga give karanna gift ekak"** (Tanglish)
2. Verify: assistant responds and returns product cards
3. Type in Sinhala script: **"ජන්මදිනය සඳහා කේක් කෙනෙක්"**
4. Verify: assistant responds in Sinhala with product results

## 8. Run type check and lint

```bash
npx tsc --noEmit   # must exit 0
npm run lint       # must exit 0 with no warnings
```

Note: there are no test files in the repo (Vitest/Playwright are installed but unused), so there
is no `test` step to run yet.

## 9. Deploy to Vercel

```bash
npx vercel --prod
# Set GOOGLE_API_KEY (or your chosen provider's key) and KAPRUKA_MCP_URL in Vercel dashboard
```

## Key file locations

| File                                          | Purpose                                                    |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `src/app/page.tsx`                            | The chat page — home route `/` (there is no `/chat` route) |
| `src/app/api/chat/route.ts`                   | Streaming chat Route Handler (custom SSE, not AI SDK's `useChat`) |
| `src/lib/mcp/client.ts`                       | MCP JSON-RPC session manager                                |
| `src/lib/ai/orchestrator.ts`                  | Multi-provider (Gemini/Claude/GPT) tool-call orchestration  |
| `src/lib/ai/system-prompt.ts`                 | Locale-aware Kiyo persona + JSON-card output contract        |
| `src/features/chat/hooks/useChat.ts`          | Client-side chat state + hand-rolled SSE parsing            |
| `src/features/cart/store.ts`                  | Zustand cart store (`sessionStorage`)                        |
| `src/features/orders/store.ts`                | Zustand orders store (`localStorage`) — not in original plan |
| `src/features/history/store.ts`               | Zustand chat-history store (`localStorage`) — not in original plan |
| `src/lib/i18n/messages/`                      | Translation files (en, si, ta-Latn) — **unused dead code**, `next-intl` not installed |
| `src/types/mcp.ts`                            | Kapruka MCP typed interfaces                                 |
| `src/types/domain.ts`                         | UI-facing domain types                                        |
