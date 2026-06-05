# Quickstart: Kiyo Shopping Assistant

**Date**: 2026-06-05 | **Branch**: `001-ai-shopping-assistant`

## Prerequisites

- Node.js 20 LTS
- pnpm 9+ (or npm/yarn)
- A Gemini API key (`GEMINI_API_KEY`)
- Git

## 1. Bootstrap the Next.js project

```bash
pnpm create next-app@latest kapruka-agent \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd kapruka-agent
```

## 2. Install dependencies

```bash
# Core
pnpm add @google/generative-ai ai next-intl zod zustand

# UI
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# shadcn/ui CLI (initialise and add primitives)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card badge input sheet skeleton toast

# Dev
pnpm add -D @next/bundle-analyzer @types/node vitest @playwright/test
```

## 3. Environment variables

Create `.env.local` (gitignored):

```bash
GEMINI_API_KEY=your_gemini_api_key_here
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
```

## 4. Verify MCP connectivity

```bash
# Quick connectivity check — should return 200 and an mcp-session-id header
curl -I -H "Accept: text/event-stream" https://mcp.kapruka.com/mcp
```

## 5. Run development server

```bash
pnpm dev
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
pnpm tsc --noEmit   # must exit 0
pnpm lint           # must exit 0 with no warnings
```

## 9. Deploy to Vercel

```bash
pnpm dlx vercel --prod
# Set GEMINI_API_KEY and KAPRUKA_MCP_URL in Vercel dashboard
```

## Key file locations

| File                                 | Purpose                             |
| ------------------------------------ | ----------------------------------- |
| `src/app/api/chat/route.ts`          | Streaming chat Route Handler        |
| `src/lib/mcp/client.ts`              | MCP SSE session manager             |
| `src/lib/ai/orchestrator.ts`         | Gemini orchestration                |
| `src/lib/ai/system-prompt.ts`        | Locale-aware system prompt          |
| `src/features/chat/hooks/useChat.ts` | Client-side chat state              |
| `src/features/cart/store.ts`         | Zustand cart store                  |
| `src/lib/i18n/messages/`             | Translation files (en, si, ta-Latn) |
| `src/types/mcp.ts`                   | Kapruka MCP typed interfaces        |
