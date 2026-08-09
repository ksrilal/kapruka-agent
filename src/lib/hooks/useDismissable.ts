"use client";

import { useEffect, type RefObject } from "react";

// Shared close-on-click-outside + close-on-Escape behavior for header
// dropdowns and slide-in panels. Escape restores focus to `triggerRef` (if
// given) so keyboard users land back where they opened the popover from,
// instead of losing their place on the page.
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        triggerRef?.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
