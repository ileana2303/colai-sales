import {
  formatCurrencyGR,
  formatIntGR,
  formatPercentGR,
} from "@/lib/utils/number";

export const accentColors = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
];

const greekMonthNames = [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος",
];

const englishMonthIndex: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function formatCurrency(value: number) {
  return `${formatCurrencyGR(value)}€`;
}

export function formatNullableCurrency(value: number | null) {
  return value == null ? "-" : formatCurrency(value);
}

export function formatNullableNumber(value: number | null, fractionDigits = 2) {
  if (value == null || !Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNullableInt(value: number | null) {
  return value == null ? "-" : formatIntGR(value);
}

export function formatNullableRatioPercent(value: number | null) {
  return value == null ? "-" : `${formatPercentGR(value * 100)}%`;
}

export type ValueTone = "danger" | "success";

export function getSignedValueTone(
  value: number | null | undefined,
): ValueTone | undefined {
  if (value == null || !Number.isFinite(value) || value === 0) return undefined;
  return value > 0 ? "success" : "danger";
}

export function getCoverRatioTone(
  ratio: number | null | undefined,
): ValueTone | undefined {
  if (ratio == null || !Number.isFinite(ratio)) return undefined;
  return getSignedValueTone(ratio - 1);
}

export function getTargetGapTone(
  actual: number | null | undefined,
  target: number | null | undefined,
): ValueTone | undefined {
  if (
    actual == null ||
    target == null ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target)
  ) {
    return undefined;
  }

  return getSignedValueTone(actual - target);
}

export function getValueToneClassName(tone?: ValueTone) {
  if (tone === "success") return "app-value--success";
  if (tone === "danger") return "app-value--danger";
  return undefined;
}

export function getMonthLabel(month: string) {
  const trimmed = month.trim();
  const monthIndex = getMonthIndex(trimmed);
  if (monthIndex != null) return greekMonthNames[monthIndex];

  const monthPart = trimmed
    .replace(/^\d+\s*/, "")
    .replace(".", "")
    .trim();

  return monthPart || trimmed;
}

export function getMonthIndex(month: string) {
  const trimmed = month.trim();
  const numericPrefix = trimmed.match(/^0?([1-9]|1[0-2])\b/);
  if (numericPrefix) {
    return Number(numericPrefix[1]) - 1;
  }

  const monthPart = trimmed
    .replace(/^\d+\s*/, "")
    .replace(".", "")
    .trim();
  if (!monthPart) return null;

  const englishIndex = englishMonthIndex[monthPart.toLowerCase()];
  if (englishIndex != null) return englishIndex;

  const greekIndex = greekMonthNames.findIndex((name) =>
    name
      .toLocaleLowerCase("el-GR")
      .startsWith(monthPart.toLocaleLowerCase("el-GR")),
  );

  return greekIndex >= 0 ? greekIndex : null;
}

export function getDelta(current: number, previous?: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function sumNullable<T>(rows: T[], selector: (row: T) => number | null) {
  return rows.reduce((sum, row) => sum + (selector(row) ?? 0), 0);
}
