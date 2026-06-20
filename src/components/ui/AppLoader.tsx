"use client";

import React from "react";

type LoaderProps = {
  /** Optional label under the loader */
  label?: string;
  /** Size in px (default 44) */
  size?: number;
  /** If true, renders on a subtle card surface */
  card?: boolean;
  /** Full-screen overlay (for blocking operations) */
  overlay?: boolean;
};

export default function AppLoader({
  label = "Loading…",
  size = 44,
  card = true,
  overlay = false,
}: LoaderProps) {
  const content = (
    <div
      className={`${card ? "app-card h-full p-3 text-center" : "text-center"} flex flex-col items-center justify-center`}
    >
      <div
        className="premium-loader mx-auto"
        style={{ width: size, height: size }}
        aria-label={label}
        role="status"
      />
      {label ? <div className="text-sm text-muted-foreground mt-3">{label}</div> : null}
    </div>
  );

  if (!overlay) return content;

  return (
    <div className="premium-loader-overlay" role="alert" aria-busy="true">
      <div style={{ width: "min(480px, 92vw)" }}>{content}</div>
    </div>
  );
}
