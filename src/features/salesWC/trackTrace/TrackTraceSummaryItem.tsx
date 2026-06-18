"use client";

import React from "react";

import { displayValue } from "@/lib/utils/string";

export default function TrackTraceSummaryItem({
  icon,
  label,
  value,
  copyable = false,
}: {
  icon: string;
  label: string;
  value: unknown;
  copyable?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const text = String(value ?? "").trim();
  const showCopy = copyable && text !== "";

  async function handleCopy() {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="track-trace-summary__item">
      <div className="track-trace-summary__label">
        <i className={`bi ${icon}`} aria-hidden />
        <span>{label}</span>
      </div>
      <div className="track-trace-summary__value d-flex align-items-center gap-2">
        <span className="text-break">{displayValue(value)}</span>
        {showCopy ? (
          <button
            type="button"
            className="btn btn-outline-secondary track-trace-copy-btn"
            aria-label={copied ? "Αντιγράφηκε" : "Αντιγραφή voucher"}
            title={copied ? "Αντιγράφηκε" : "Αντιγραφή"}
            onClick={() => void handleCopy()}
          >
            <i
              className={`bi ${copied ? "bi-check2" : "bi-clipboard"}`}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}
