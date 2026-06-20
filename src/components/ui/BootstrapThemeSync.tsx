"use client";

import { useEffect } from "react";

import { ThemeMode, useSettingsStore } from "@/stores/settingsStore";

const STORAGE_KEY = "colai_theme";

export function BootstrapThemeSync() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    setTheme(prefersDark ? "dark" : "light");
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.style.backgroundColor =
      theme === "dark" ? "#0b1220" : "#ffffff";
  }, [theme]);

  return null;
}
