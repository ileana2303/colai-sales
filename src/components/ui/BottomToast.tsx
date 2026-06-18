"use client";

import React from "react";

type BottomToastProps = {
  message: string | null;
  durationMs?: number;
  onDismiss?: () => void;
};

export default function BottomToast({
  message,
  durationMs = 3000,
  onDismiss,
}: BottomToastProps) {
  React.useEffect(() => {
    if (!message) return;

    const timeoutId = window.setTimeout(() => {
      onDismiss?.();
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="app-bottom-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="app-bottom-toast__inner alert alert-success mb-0 px-3 py-2 shadow-sm">
        <i className="bi bi-check-circle-fill me-2" aria-hidden />
        {message}
      </div>
    </div>
  );
}
