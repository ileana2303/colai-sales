/** Display numbers with comma thousands and dot decimals (102,000.00). */
const DISPLAY_NUMBER_LOCALE = "en-US";

const currencyFmt = new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
  maximumFractionDigits: 0,
});

export const matrixCurrencyFormatter = new Intl.NumberFormat(
  DISPLAY_NUMBER_LOCALE,
  {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  },
);

export const matrixNumberFormatter = new Intl.NumberFormat(
  DISPLAY_NUMBER_LOCALE,
  {
    maximumFractionDigits: 0,
  },
);

/** Format a numeric amount for currency display. */
export function formatCurrencyGR(value: number): string;
/** Coerce API/form values before formatting. */
export function formatCurrencyGR(value: unknown): string;
export function formatCurrencyGR(value: unknown): string {
  const n = typeof value === "number" ? value : parseLocaleNumber(value);
  const safe = Number.isFinite(n) ? n : 0;

  return currencyFmt.format(safe);
}

export function formatIntGR(value: number): string {
  return intFmt.format(Number.isFinite(value) ? value : 0);
}

/** Percent values always round to whole numbers (e.g. 93.898 → "94"). */
export function formatPercentGR(value: number): string {
  if (!Number.isFinite(value)) return intFmt.format(0);
  return intFmt.format(Math.round(value));
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

/** Parses locale-formatted numbers (comma thousands, optional €). */
export function parseLocaleNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const compact = raw.replace(/[€\s]/g, "");

  if (compact.includes(",") && compact.includes(".")) {
    const lastComma = compact.lastIndexOf(",");
    const lastDot = compact.lastIndexOf(".");

    if (lastComma > lastDot) {
      const normalized = compact.replace(/\./g, "").replace(",", ".");
      const amount = Number(normalized);
      return Number.isFinite(amount) ? amount : 0;
    }

    const normalized = compact.replace(/,/g, "");
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  if (compact.includes(",")) {
    const [, fractional = ""] = compact.split(",");
    if (fractional.length > 0 && fractional.length <= 2) {
      const amount = Number(compact.replace(",", "."));
      return Number.isFinite(amount) ? amount : 0;
    }

    const amount = Number(compact.replace(/,/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  }

  const amount = Number(compact);
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

export function formatDisplayNumber(
  value: number,
  fractionDigits = 2,
): string {
  if (!Number.isFinite(value)) return intFmt.format(0);

  return new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
