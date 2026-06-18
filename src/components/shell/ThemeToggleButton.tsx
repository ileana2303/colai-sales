"use client";

import { toggleTheme } from "@/features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function ThemeToggleButton() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.settings.theme);

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary app-pill"
      aria-label="Toggle theme"
      onClick={() => dispatch(toggleTheme())}
    >
      <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"}`} />
    </button>
  );
}
