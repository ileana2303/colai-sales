/** Format a numeric amount for el-GR currency display. */
export function formatCurrencyGR(value: number): string;
/** Coerce API/form values before formatting. */
export function formatCurrencyGR(value: unknown): string;
export function formatCurrencyGR(value: unknown): string {
  const n = typeof value === "number" ? value : parseLocaleNumber(value);
  const safe = Number.isFinite(n) ? n : 0;

  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

const intFmt = new Intl.NumberFormat("el-GR", { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat("el-GR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatIntGR(value: number): string {
  return intFmt.format(Number.isFinite(value) ? value : 0);
}

export function formatPercentGR(value: number): string {
  return pctFmt.format(Number.isFinite(value) ? value : 0);
}

export function parseGreekDecimal(value: unknown): number {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return value;

  const normalized = String(value)
    .trim()
    .replaceAll(".", "")
    .replaceAll(",", ".");
  return parseFloat(normalized);
}

/** Parses locale-formatted numbers (Greek decimals, optional €, thousand separators). */
export function parseLocaleNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const compact = raw.replace(/[€\s]/g, "");
  const normalized =
    compact.includes(",") && compact.includes(".")
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

export function formatCurrencyWithEuro(
  value: unknown,
  emptyFallback = "-",
): string {
  const text = String(value ?? "").trim();
  if (!text) return emptyFallback;

  return `${formatCurrencyGR(parseLocaleNumber(value))}€`;
}

export function formatFileSizeMB(bytes: unknown): string {
  const size =
    typeof bytes === "number" ? bytes : parseFloat(String(bytes ?? "0"));
  const safe = Number.isFinite(size) ? size : 0;
  return `${(safe / 1024 / 1024).toFixed(2)} MB`;
}
