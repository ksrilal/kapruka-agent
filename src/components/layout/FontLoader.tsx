"use client";

import { useEffect } from "react";

// Injected client-side (not SSR-ed) so browser extensions that mutate <link>
// tags before hydration (e.g. dark-mode extensions) can't cause a hydration
// mismatch — there is nothing on the server-rendered tree to diff against.
export function FontLoader() {
  useEffect(() => {
    if (document.querySelector('link[href*="fontshare.com"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.fontshare.com/v2/css?f[]=gilroy@700&display=swap";
    document.head.appendChild(link);
  }, []);

  return null;
}
