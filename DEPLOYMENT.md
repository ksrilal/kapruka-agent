# Deployment Guide

_Last verified against code: 2026-07-27._

## Vercel Environment Variables

The AI provider is selected via `AI_PROVIDER`. Set the matching API key for whichever provider
you choose — only one is required.

| Variable             | Required                          | Description                                                                 |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `KAPRUKA_MCP_URL`    | No (has a default)                 | Kapruka MCP endpoint. Defaults to `https://mcp.kapruka.com/mcp` if unset.    |
| `AI_PROVIDER`        | No (defaults to `google`)          | `google` \| `anthropic` \| `openai`. Also accepts aliases `claude`, `chatgpt`. |
| `GOOGLE_API_KEY`     | ✅ if using the default provider   | Google Gemini API key. **Not** `GEMINI_API_KEY` — that variable name is not read anywhere in the code. |
| `ANTHROPIC_API_KEY`  | ✅ if `AI_PROVIDER=anthropic`       | Anthropic API key.                                                          |
| `OPENAI_API_KEY`     | ✅ if `AI_PROVIDER=openai`          | OpenAI API key.                                                             |
| `AI_API_KEY`         | No                                  | Generic override — takes precedence over the provider-specific key above.  |
| `GOOGLE_AI_MODEL`    | No                                  | Overrides the Gemini model id. Default: `models/gemini-2.0-flash`.          |
| `ANTHROPIC_AI_MODEL` | No                                  | Overrides the Claude model id. Default: `claude-sonnet-4-6`.                |
| `OPENAI_AI_MODEL`    | No                                  | Overrides the OpenAI model id. Default: `gpt-4o`.                           |
| `AI_MODEL`           | No                                  | Generic model-id override — takes precedence over the provider-specific one above. |

## Deploy Steps

1. Push branch to GitHub
2. Connect repo to Vercel — framework: **Next.js**, root: `/`
3. Set env vars above in Vercel dashboard → Settings → Environment Variables (at minimum,
   `GOOGLE_API_KEY` if using the default provider)
4. Deploy

`src/app/api/chat/route.ts` sets `maxDuration = 60`, which requires a **Vercel Pro** plan or
higher — on the Hobby plan, functions are capped at 10s and long tool-calling turns may time out.

## Rate Limits

- Kapruka MCP (as documented at the time this app was built): 60 requests/minute per IP; 30
  `create_order` calls/hour. This app's own `/api/chat` handler enforces a 60 requests/60s per-IP
  limit in-memory (per server instance, not distributed across regions/instances) — it does not
  separately enforce the 30/hour `create_order` limit; that relies on the upstream MCP rejecting
  excess requests.
- Payment URLs (`checkout_url` from `create_order`) expire after 60 minutes.
- Provider quotas: check your AI provider's dashboard (Google AI Studio / Anthropic Console /
  OpenAI Platform) for current rate limits — these are independent of the Kapruka MCP limits.

## Smoke Test After Deploy

```bash
curl https://<your-deployment>.vercel.app/api/health
# Expected shape: {"status":"ok","ts":"...","env":{"ai_provider":"google","ai_key_set":true,"mcp":true}}
```

## Quickstart Validation

See `specs/001-ai-shopping-assistant/quickstart.md` for the full local-dev and validation
checklist.
