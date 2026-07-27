"use client";

import { useEffect, useState } from "react";

// Matches the app's `sm:` Tailwind breakpoint (640px) used throughout.
const QUERY = "(min-width: 640px)";

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
