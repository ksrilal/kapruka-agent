"use client";

import { useEffect } from "react";

// Closes a slide-in panel (Cart/Orders/History/Recipients/Addresses/mobile
// sheets) on Escape — these panels already close on backdrop click, but had
// no keyboard equivalent, stranding keyboard-only users inside them.
export function usePanelEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
