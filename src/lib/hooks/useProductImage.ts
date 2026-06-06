"use client";

import { useState, useEffect } from "react";

const IMG_CACHE_MAX = 200;
const imgCache = new Map<string, string | null>();

function imgCacheSet(key: string, value: string | null) {
  if (imgCache.size >= IMG_CACHE_MAX) {
    imgCache.delete(imgCache.keys().next().value!);
  }
  imgCache.set(key, value);
}

export function useProductImage(productUrl: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(() =>
    productUrl ? (imgCache.get(productUrl) ?? null) : null
  );

  useEffect(() => {
    if (!productUrl) return;
    if (imgCache.has(productUrl)) {
      setSrc(imgCache.get(productUrl) ?? null);
      return;
    }
    let cancelled = false;
    fetch(`/api/product-image?url=${encodeURIComponent(productUrl)}`)
      .then((r) => r.json())
      .then((data: { image_url: string | null }) => {
        if (cancelled) return;
        imgCacheSet(productUrl, data.image_url);
        setSrc(data.image_url);
      })
      .catch(() => {
        if (!cancelled) imgCacheSet(productUrl, null);
      });
    return () => { cancelled = true; };
  }, [productUrl]);

  return src;
}
