import { type NextRequest, NextResponse } from "next/server";

// Simple in-process cache — survives the server process lifetime
const cache = new Map<string, { url: string; at: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  const productUrl = req.nextUrl.searchParams.get("url");
  if (!productUrl || !productUrl.includes("kapruka.com")) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const cached = cache.get(productUrl);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json({ image_url: cached.url });
  }

  try {
    const res = await fetch(productUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KaprukaAgent/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    const imageUrl = match?.[1] ?? null;
    if (imageUrl) cache.set(productUrl, { url: imageUrl, at: Date.now() });

    return NextResponse.json({ image_url: imageUrl });
  } catch {
    return NextResponse.json({ image_url: null });
  }
}
