import type { Maybe } from "@/types/api/common";

/** True when value is null/undefined or whitespace-only (after trim). */
export function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

/** True when value has non-whitespace text. */
export function hasText(value: unknown): boolean {
  return !isBlank(value);
}

/** Trimmed string, or "" when blank. */
export function trimmedString(value: unknown): string {
  return isBlank(value) ? "" : String(value).trim();
}

/** First non-blank value as trimmed string, or "". */
export function pickFirstNonBlankString(...values: unknown[]): string {
  for (const value of values) {
    if (hasText(value)) return String(value).trim();
  }
  return "";
}

/** Trimmed display text, or fallback when blank (default "-"). */
export function displayValue(value: unknown, fallback = "-"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

/** Trimmed metric text, or fallback when blank (default "0"). */
export function displayMetric(value: unknown, fallback = "0"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

/** Keep digits only. */
export function onlyDigits(value: Maybe<string>): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Normalize text for case-insensitive search (Greek locale). */
export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("el-GR");
}
