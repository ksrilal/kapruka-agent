import { type NextRequest, NextResponse } from "next/server";

// In-process cache with TTL and size cap
const cache = new Map<string, { url: string | null; at: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX = 500;

function cacheSet(key: string, value: { url: string | null; at: number }) {
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, value);
}

// In-flight deduplication — prevents N concurrent requests for same URL
const inFlight = new Map<string, Promise<string | null>>();

function scrapeImage(productUrl: string): Promise<string | null> {
  const existing = inFlight.get(productUrl);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(productUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KaprukaAgent/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;

      const html = await res.text();
      const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
        ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

      const imageUrl = match?.[1] ?? null;
      cacheSet(productUrl, { url: imageUrl, at: Date.now() });
      return imageUrl;
    } catch {
      cacheSet(productUrl, { url: null, at: Date.now() });
      return null;
    } finally {
      inFlight.delete(productUrl);
    }
  })();

  inFlight.set(productUrl, promise);
  return promise;
}

function isKaprukaUrl(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return hostname === "kapruka.com" || hostname.endsWith(".kapruka.com");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const productUrl = req.nextUrl.searchParams.get("url");
  if (!productUrl || !isKaprukaUrl(productUrl)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const cached = cache.get(productUrl);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json({ image_url: cached.url });
  }

  const imageUrl = await scrapeImage(productUrl);
  return NextResponse.json({ image_url: imageUrl });
}
