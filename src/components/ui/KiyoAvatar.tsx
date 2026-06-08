"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useThemeStore, syncThemeFromDom } from "@/features/theme/store";

interface Props {
  size?: number;
  className?: string;
}

export function KiyoAvatar({ size = 32, className = "" }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    syncThemeFromDom();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-xl ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={isLight ? "/icon-white.png" : "/app_icon.png"}
        alt="Kiyo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority
      />
    </div>
  );
}
