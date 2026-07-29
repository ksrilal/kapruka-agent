"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useThemeStore, syncThemeFromDom } from "@/features/theme/store";

// logo.png is tuned for dark backgrounds (blended in via `.brand-logo`'s screen
// mode); logo-white.png is a flat white-card variant made for light surfaces.
export function BrandLogo({ size = 400 }: { size?: number }) {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    syncThemeFromDom();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";

  return (
    <Image
      src={isLight ? "/logo-white.png" : "/logo.png"}
      alt="Kiyo — Your AI Shopping Assistant"
      width={size}
      height={size}
      className="brand-logo"
      priority
    />
  );
}
