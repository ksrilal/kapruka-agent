# Deployment Guide

## Vercel Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (Gemini 2.5 Flash) |
| `KAPRUKA_MCP_URL` | ✅ | Kapruka MCP endpoint (default: `https://mcp.kapruka.com/mcp`) |

## Deploy Steps

1. Push branch to GitHub
2. Connect repo to Vercel — framework: **Next.js**, root: `/`
3. Set env vars above in Vercel dashboard → Settings → Environment Variables
4. Deploy

## Rate Limits

- Kapruka MCP: 60 requests/minute per IP; 30 `create_order` calls/hour
- Payment URLs expire after 60 minutes
- Gemini 2.5 Flash: see Google AI Studio quotas

## Smoke Test After Deploy

```bash
curl https://<your-deployment>.vercel.app/api/health
# Expected: {"status":"ok","ts":"...","env":{"gemini":true,"mcp":true}}
```

## Quickstart Validation

See `specs/001-ai-shopping-assistant/quickstart.md` for full validation checklist.
