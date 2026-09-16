import type { FilterOption } from "@/features/powerBI/types/PowerBiTable.types";
import type {
  PowerBiMatrixSourceRow,
  ReportMatrixPeriodMeta,
} from "@/features/powerBI/types/reportMatrixData.types";
import { getMonthIndex } from "@/lib/bi-reports/reportUtils";

export const GREEK_SHORT_MONTH_LABELS = [
  "Ιαν",
  "Φεβ",
  "Μαρ",
  "Απρ",
  "Μάιος",
  "Ιουν",
  "Ιουλ",
  "Αυγ",
  "Σεπ",
  "Οκτ",
  "Νοε",
  "Δεκ",
] as const;

export function getShortMonthLabel(index: number) {
  return GREEK_SHORT_MONTH_LABELS[index] ?? String(index + 1);
}

export function formatMonthRange(startIndex: number, endIndex: number) {
  if (startIndex === endIndex) {
    return getShortMonthLabel(startIndex);
  }

  return `${getShortMonthLabel(startIndex)} - ${getShortMonthLabel(endIndex)}`;
}

export function parseMonthNumber(value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const parsed =
    typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return null;
  return parsed;
}

export function isClosedMonthStatus(status?: string | null) {
  return status?.trim().toLowerCase() === "completed";
}

export function monthIndexFromLookupKey(monthKey: string) {
  const match = /^m(\d+)$/.exec(monthKey.trim());
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 && index <= 11 ? index : null;
}

export type ClosedPeriodRangeOptions = {
  closedPeriodStartMonthIndex?: number | null;
  closedPeriodEndMonthIndex?: number | null;
};

export type ClosedPeriodWindow = {
  closedMonthIndexes: number[];
  lastClosedMonthIndex: number | null;
  selectedStartMonthIndex: number | null;
  selectedEndMonthIndex: number | null;
};

function emptyClosedPeriodWindow(
  closedMonthIndexes: number[] = [],
  lastClosedMonthIndex: number | null = null,
): ClosedPeriodWindow {
  return {
    closedMonthIndexes,
    lastClosedMonthIndex,
    selectedStartMonthIndex: null,
    selectedEndMonthIndex: null,
  };
}

function buildContiguousClosedMonthIndexes(
  closedMonthsCount: number,
  lastClosedMonthIndex: number,
) {
  return Array.from({ length: closedMonthsCount }, (_, offset) => {
    const index = lastClosedMonthIndex - (closedMonthsCount - 1 - offset);
    return index;
  }).filter((index) => index >= 0 && index <= 11);
}

function clampMonthIndex(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function resolveClosedPeriodWindowFromMeta(
  period: ReportMatrixPeriodMeta | null | undefined,
  range?: ClosedPeriodRangeOptions | null,
): ClosedPeriodWindow {
  if (!period) {
    return emptyClosedPeriodWindow();
  }

  const closedMonthsCount = period.closedMonthsCount ?? 0;
  const lastClosedMonthNumber = parseMonthNumber(period.lastClosedMonth);
  const lastClosedMonthIndex =
    lastClosedMonthNumber != null ? lastClosedMonthNumber - 1 : null;
  const closedMonthIndexes =
    closedMonthsCount > 0 && lastClosedMonthIndex != null
      ? buildContiguousClosedMonthIndexes(
          closedMonthsCount,
          lastClosedMonthIndex,
        )
      : [];

  return applyClosedPeriodMonthRange(
    closedMonthIndexes,
    lastClosedMonthIndex,
    range,
  );
}

export function applyClosedPeriodMonthRange(
  closedMonthIndexes: number[],
  lastClosedMonthIndex: number | null,
  range?: ClosedPeriodRangeOptions | null,
): ClosedPeriodWindow {
  if (lastClosedMonthIndex == null || !closedMonthIndexes.length) {
    return emptyClosedPeriodWindow(closedMonthIndexes, lastClosedMonthIndex);
  }

  const selectedEndMonthIndex =
    range?.closedPeriodEndMonthIndex != null
      ? clampMonthIndex(
          range.closedPeriodEndMonthIndex,
          0,
          lastClosedMonthIndex,
        )
      : lastClosedMonthIndex;
  const selectedStartMonthIndex =
    range?.closedPeriodStartMonthIndex != null
      ? clampMonthIndex(
          range.closedPeriodStartMonthIndex,
          0,
          selectedEndMonthIndex,
        )
      : 0;

  return {
    closedMonthIndexes: closedMonthIndexes.filter(
      (index) =>
        index >= selectedStartMonthIndex && index <= selectedEndMonthIndex,
    ),
    lastClosedMonthIndex,
    selectedStartMonthIndex,
    selectedEndMonthIndex,
  };
}

/** @deprecated Prefer applyClosedPeriodMonthRange. */
export function applyClosedPeriodEndMonthIndex(
  closedMonthIndexes: number[],
  lastClosedMonthIndex: number | null,
  closedPeriodEndMonthIndex?: number | null,
): ClosedPeriodWindow {
  return applyClosedPeriodMonthRange(closedMonthIndexes, lastClosedMonthIndex, {
    closedPeriodEndMonthIndex,
  });
}

export function getUniqueClosedMonthIndexes(
  rows: PowerBiMatrixSourceRow[],
): number[] {
  const monthIndexes = new Set<number>();

  for (const row of rows) {
    if (!isClosedMonthStatus(row.closedMonthStatus)) continue;

    const month = String(row.month ?? "").trim();
    const monthIndex = month ? getMonthIndex(month) : null;
    if (monthIndex != null) {
      monthIndexes.add(monthIndex);
    }
  }

  return [...monthIndexes].sort((left, right) => left - right);
}

export function resolveClosedPeriodWindowFromRows(
  rows: PowerBiMatrixSourceRow[],
  range?: ClosedPeriodRangeOptions | null,
): ClosedPeriodWindow {
  const closedMonthIndexes = getUniqueClosedMonthIndexes(rows);
  const lastClosedMonthIndex = closedMonthIndexes.at(-1) ?? null;

  return applyClosedPeriodMonthRange(
    closedMonthIndexes,
    lastClosedMonthIndex,
    range,
  );
}

export function buildClosedPeriodEndMonthOptions(
  lastClosedMonthIndex: number | null | undefined,
): FilterOption[] {
  if (lastClosedMonthIndex == null || lastClosedMonthIndex < 0) return [];

  return Array.from({ length: lastClosedMonthIndex + 1 }, (_, index) => ({
    value: String(index),
    label: formatMonthRange(0, index),
  }));
}

export function isDefaultClosedPeriodEndMonth(
  closedPeriodEndMonthIndex: number | null | undefined,
  lastClosedMonthIndex: number | null | undefined,
) {
  if (lastClosedMonthIndex == null) return true;
  return (
    closedPeriodEndMonthIndex == null ||
    closedPeriodEndMonthIndex === lastClosedMonthIndex
  );
}

export function isDefaultClosedPeriodWindow(
  range: ClosedPeriodRangeOptions | null | undefined,
  lastClosedMonthIndex: number | null | undefined,
) {
  const isDefaultStart =
    range?.closedPeriodStartMonthIndex == null ||
    range.closedPeriodStartMonthIndex === 0;

  return (
    isDefaultStart &&
    isDefaultClosedPeriodEndMonth(
      range?.closedPeriodEndMonthIndex,
      lastClosedMonthIndex,
    )
  );
}

export function shouldIncludeClosedMonthForPeriod(
  month: string | null | undefined,
  status: string | null | undefined,
  closedPeriodEndMonthIndex?: number | null,
  closedPeriodStartMonthIndex?: number | null,
) {
  if (!isClosedMonthStatus(status)) return false;

  const monthIndex = month ? getMonthIndex(month) : null;
  if (monthIndex == null) return false;

  if (
    closedPeriodStartMonthIndex != null &&
    monthIndex < closedPeriodStartMonthIndex
  ) {
    return false;
  }

  if (
    closedPeriodEndMonthIndex != null &&
    monthIndex > closedPeriodEndMonthIndex
  ) {
    return false;
  }

  return true;
}

export function shouldTreatMonthAsOpenForPeriod(
  month: string | null | undefined,
  status: string | null | undefined,
  closedPeriodEndMonthIndex?: number | null,
) {
  if (!month) return false;
  if (!isClosedMonthStatus(status)) return true;

  if (closedPeriodEndMonthIndex == null) return false;

  const monthIndex = getMonthIndex(month);
  return monthIndex != null && monthIndex > closedPeriodEndMonthIndex;
}
