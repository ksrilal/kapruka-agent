import { type NextRequest, NextResponse } from "next/server";

// In-process cache with TTL
const cache = new Map<string, { url: string | null; at: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

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
      cache.set(productUrl, { url: imageUrl, at: Date.now() });
      return imageUrl;
    } catch {
      cache.set(productUrl, { url: null, at: Date.now() });
      return null;
    } finally {
      inFlight.delete(productUrl);
    }
  })();

  inFlight.set(productUrl, promise);
  return promise;
}

export async function GET(req: NextRequest) {
  const productUrl = req.nextUrl.searchParams.get("url");
  if (!productUrl || !productUrl.includes("kapruka.com")) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const cached = cache.get(productUrl);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json({ image_url: cached.url });
  }

  const imageUrl = await scrapeImage(productUrl);
  return NextResponse.json({ image_url: imageUrl });
}
