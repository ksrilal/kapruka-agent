"use client";

import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "kiyo-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private browsing, etc.) — theme just won't persist
  }
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  theme: "dark",
  setTheme(theme) {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme() {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));

// Sync the store's initial value with whatever the pre-paint script already
// applied to <html> (see layout.tsx) — avoids a flash where the store says
// "dark" but the DOM is already showing "light" from a stored preference.
export function syncThemeFromDom() {
  const isLight = document.documentElement.classList.contains("light");
  useThemeStore.setState({ theme: isLight ? "light" : "dark" });
}
