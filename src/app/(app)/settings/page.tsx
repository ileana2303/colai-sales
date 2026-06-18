"use client";

import { toggleTheme } from "@/features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.settings.theme);

  const handleTheming = () => {
    dispatch(toggleTheme());
  };

  return (
    <div
      className="d-flex flex-column h-100"
      style={{
        minHeight: 0,
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="app-card mb-3 p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold">Theme</div>
            <div className="text-secondary small">Light / Dark</div>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary app-pill"
            onClick={handleTheming}
          >
            <i
              className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"} me-2`}
            />
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <div className="app-card p-3">
        <div className="fw-semibold mb-2">About</div>
        <div className="text-secondary small">
          {process.env.NEXT_PUBLIC_APP_VERSION}
        </div>
      </div>
    </div>
  );
}
