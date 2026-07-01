import {
  type ReportMatrixColumn,
  type ReportMatrixLeadingColumn,
  type ReportMatrixRow,
  type ReportMatrixRowMetrics,
  type ReportMatrixSection,
  type ReportMatrixSectionSummary,
  type ReportMatrixTone,
} from "@/features/powerBI/ReportMatrixTable";
import {
  getMonthLabel,
  getMonthIndex,
  getYearComparisonTone,
} from "@/lib/bi-reports/reportUtils";
import {
  findPowerBiSellerByCode,
  type PowerBiSellerRow,
} from "@/lib/bi-reports/sellers";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import {
  formatPercentGR,
  matrixCurrencyFormatter,
  matrixNumberFormatter,
} from "@/lib/utils/number";
import type { ReactNode } from "react";

export type PowerBiMatrixSourceRow = {
  group1?: string | null;
  group2?: string | null;
  group3?: string | null;
  team?: string | null;
  sellerCode?: string | null;
  sellerName?: string | null;
  month?: string | null;
  closedMonthStatus?: string | null;
  currency?: number | null;
  tcy?: number | null;
  vcy?: number | null;
  vly?: number | null;
  vlc?: number | null;
  vTrend?: number | null;
};

export type BuildReportMatrixRowsInput = {
  categoryOrder?: string[];
  currentRows: PowerBiMatrixSourceRow[];
  group2Order?: string[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
  sellersCatalog?: PowerBiSellerRow[];
};

export function enrichMatrixRowsWithSellers(
  rows: PowerBiMatrixSourceRow[],
  sellersCatalog: PowerBiSellerRow[],
): PowerBiMatrixSourceRow[] {
  if (!sellersCatalog.length) return rows;

  return rows.map((row) => {
    const sellerCode = row.sellerCode?.trim();
    if (!sellerCode) return row;

    const match = findPowerBiSellerByCode(sellersCatalog, sellerCode);
    if (!match) return row;

    return {
      ...row,
      team: match.team || row.team,
      sellerName: match.salesPerson || row.sellerName,
    };
  });
}

function filterMatrixRowsBySellersCatalog(
  rows: PowerBiMatrixSourceRow[],
  sellersCatalog: PowerBiSellerRow[],
): PowerBiMatrixSourceRow[] {
  if (!sellersCatalog.length) return rows;

  const allowedSellerCodes = new Set(
    sellersCatalog
      .map((seller) => normalizeSellerCode(seller.sellerCode))
      .filter(Boolean),
  );

  return rows.filter((row) => {
    const sellerCode = normalizeSellerCode(row.sellerCode);
    return !sellerCode || allowedSellerCodes.has(sellerCode);
  });
}

type MatrixAggregate = {
  group1: string;
  group2: string;
  group3: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  currency: number | null;
  tcyAll: number;
  vcyAll: number;
  tcyClosed: number;
  vcyClosed: number;
  vlc: number;
  vlcAll: number;
  vTrend: number;
  openMonthTcyByMonth: Map<string, number>;
  closedMonthKeys: Set<string>;
  hasClosedMonthStatus: boolean;
};

type MonthlyTargetMetrics = {
  extraMonthlyTarget: number | null;
  monthlyTarget: number | null;
  newMonthlyTarget: number | null;
};

type MatrixRowOptions = {
  childCount?: number;
  extraMonthlyTargetSum?: number | null;
  key?: string;
  parentKey?: string;
  rowKind?: ReportMatrixRow["rowKind"];
  leadingValues?: Record<string, ReactNode>;
};

const EMPTY_VALUE = "-";
const TOTAL_CURRENCY_BUCKETS = [0, 1] as const;
const greekShortMonthLabels = [
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

type TotalCurrencyBucket = (typeof TOTAL_CURRENCY_BUCKETS)[number];

type ReportMatrixSectionSummaries = Partial<
  Record<
    "closed-months" | "current-year" | "monthly-target" | "previous-period",
    ReportMatrixSectionSummary
  >
>;

type CurrencySplitRowOptions = {
  aggregates: MatrixAggregate[];
  keyPrefix: string;
  labelResolver: (
    currency: TotalCurrencyBucket,
    showCurrencyLabel: boolean,
  ) => string;
  parentKey?: string;
};

const currencyFormatter = matrixCurrencyFormatter;
const numberFormatter = matrixNumberFormatter;

export const reportMatrixLeadingColumns: ReportMatrixLeadingColumn[] = [
  { key: "category", label: "Κατηγορία Στόχου", width: 196 },
  { key: "team", label: "Team", width: 108 },
  { key: "seller", label: "Seller Name - Seller code", width: 168 },
];

function usesPlainNumberFormat(aggregate: MatrixAggregate) {
  return aggregate.currency === 0;
}

function formatMatrixValue(
  value: number | null | undefined,
  aggregate: MatrixAggregate,
  isTotal = false,
) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  if (value === 0) {
    return usesPlainNumberFormat(aggregate) ? "0" : currencyFormatter.format(0);
  }
  if (usesPlainNumberFormat(aggregate)) {
    return numberFormatter.format(value);
  }
  return currencyFormatter.format(value);
}

function formatMatrixPercent(ratio: number | null | undefined) {
  if (ratio == null || !Number.isFinite(ratio)) return EMPTY_VALUE;
  if (ratio === 0) return "0%";
  return `${formatPercentGR(ratio * 100)}%`;
}

function formatCoverPercent(target: number, result: number) {
  if (!target || !Number.isFinite(target)) return EMPTY_VALUE;
  return formatMatrixPercent(result / target);
}

function formatGapDiff(
  result: number,
  target: number,
  aggregate: MatrixAggregate,
  isTotal = false,
) {
  if (!Number.isFinite(target) || !Number.isFinite(result)) return EMPTY_VALUE;
  if (target === 0) return EMPTY_VALUE;
  return formatMatrixValue(result - target, aggregate, isTotal);
}

/** Values below this round to zero in matrix display and are not a YoY baseline. */
const YEAR_COMPARISON_BASELINE_EPSILON = 0.5;

function hasYearComparisonBaseline(value: number | null | undefined) {
  return (
    value != null &&
    Number.isFinite(value) &&
    Math.abs(value) >= YEAR_COMPARISON_BASELINE_EPSILON
  );
}

function formatYearComparison(current: number, previous: number) {
  if (!hasYearComparisonBaseline(previous)) return EMPTY_VALUE;
  if (!Number.isFinite(current)) return EMPTY_VALUE;
  return formatMatrixPercent(current / previous);
}

function usesPrecomputedCover(aggregate: MatrixAggregate) {
  return (
    aggregate.currency === 0 &&
    normalizeKeyPart(aggregate.group2) === normalizeKeyPart("ΠΕΡΙΣΤΑΤΙΚΑ")
  );
}

function toCoverRatio(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  if (value === 0) return 0;
  return Math.abs(value) > 1.5 ? value / 100 : value;
}

function formatPrecomputedCover(value: number | null | undefined) {
  const ratio = toCoverRatio(value);
  if (ratio == null) return EMPTY_VALUE;
  return formatMatrixPercent(ratio);
}

function formatMatrixCoverMetrics(
  aggregate: MatrixAggregate,
  closedPeriod: { result: number; target: number },
  rowKind: ReportMatrixRow["rowKind"],
  isTotal: boolean,
) {
  if (usesPrecomputedCover(aggregate)) {
    if (isTotal || rowKind !== "detail") {
      return {
        currentCover: EMPTY_VALUE,
        previousCover: EMPTY_VALUE,
      };
    }

    return {
      currentCover: formatPrecomputedCover(aggregate.vTrend),
      previousCover: formatPrecomputedCover(closedPeriod.result),
    };
  }

  return {
    currentCover: formatCoverPercent(aggregate.tcyAll, aggregate.vTrend),
    previousCover: formatCoverPercent(closedPeriod.target, closedPeriod.result),
  };
}

function formatYearDiff(
  current: number,
  previous: number,
  aggregate: MatrixAggregate,
  isTotal = false,
) {
  if (!Number.isFinite(current) || !Number.isFinite(previous))
    return EMPTY_VALUE;
  if (!hasYearComparisonBaseline(previous)) return EMPTY_VALUE;
  return formatMatrixValue(current - previous, aggregate, isTotal);
}

function buildMetricCellTones(values: {
  currentDiff: number;
  previousDiff: number;
  yearDiff: number;
}) {
  const cellTones: Record<string, ReportMatrixTone> = {};
  const previousTone = getYearComparisonTone(values.previousDiff);
  if (previousTone) {
    cellTones.previousDiff = previousTone;
    cellTones.previousCover = previousTone;
  }

  const currentTone = getYearComparisonTone(values.currentDiff);
  if (currentTone) {
    cellTones.currentDiff = currentTone;
    cellTones.currentCover = currentTone;
  }

  const yearTone = getYearComparisonTone(values.yearDiff);
  if (yearTone) {
    cellTones.yearDiff = yearTone;
    cellTones.yearComparison = yearTone;
  }

  return Object.keys(cellTones).length ? cellTones : undefined;
}

export type MatrixLySales = {
  /** 2025 sales summed for the same closed months as 2026. */
  vlcSamePeriod: number;
  /** 2025 sales summed for all months in the dataset. */
  vlcAll: number;
};

function metricsFromAggregate(
  aggregate: MatrixAggregate,
): ReportMatrixRowMetrics {
  return {
    currency: aggregate.currency,
    tcyAll: aggregate.tcyAll,
    vcyAll: aggregate.vcyAll,
    tcyClosed: aggregate.tcyClosed,
    vcyClosed: aggregate.vcyClosed,
    vlc: aggregate.vlc,
    vlcAll: aggregate.vlcAll,
    vTrend: aggregate.vTrend,
    hasClosedMonthStatus: aggregate.hasClosedMonthStatus,
    openMonthTcyByMonth: Object.fromEntries(aggregate.openMonthTcyByMonth),
  };
}

function aggregateFromMetrics(
  metrics: ReportMatrixRowMetrics,
): MatrixAggregate {
  return {
    group1: "",
    group2: "",
    group3: "",
    team: "",
    sellerCode: "",
    sellerName: "",
    currency: metrics.currency,
    tcyAll: metrics.tcyAll,
    vcyAll: metrics.vcyAll,
    tcyClosed: metrics.tcyClosed,
    vcyClosed: metrics.vcyClosed,
    vlc: metrics.vlc,
    vlcAll: metrics.vlcAll,
    vTrend: metrics.vTrend,
    hasClosedMonthStatus: metrics.hasClosedMonthStatus,
    openMonthTcyByMonth: new Map(Object.entries(metrics.openMonthTcyByMonth)),
    closedMonthKeys: new Set(),
  };
}

function sumExtraMonthlyTarget(aggregates: MatrixAggregate[]): number | null {
  let sum = 0;
  let hasValue = false;

  for (const aggregate of aggregates) {
    const { extraMonthlyTarget } = computeMonthlyTargetMetrics(aggregate);
    if (extraMonthlyTarget == null) continue;
    hasValue = true;
    sum += extraMonthlyTarget;
  }

  return hasValue ? sum : null;
}

export function buildReportMatrixTotalRows(
  rows: ReportMatrixRow[],
): ReportMatrixRow[] {
  const aggregates = rows
    .filter(
      (row) =>
        !row.isTotal &&
        row.rowKind !== "category" &&
        row.rowKind !== "group3" &&
        row.metrics,
    )
    .map((row) => aggregateFromMetrics(row.metrics!));

  return buildCurrencySplitTotalRows({
    aggregates,
    keyPrefix: "total",
    labelResolver: getTotalRowLabel,
  });
}

function formatOptionalMatrixValue(
  value: number | null,
  aggregate: MatrixAggregate,
  isTotal = false,
) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  return formatMatrixValue(value, aggregate, isTotal);
}

function isClosedMonth(status?: string | null) {
  return status?.trim().toLowerCase() === "completed";
}

function getMonthSortIndex(month: string) {
  return getMonthIndex(month) ?? Number.MAX_SAFE_INTEGER;
}

function getShortMonthLabel(index: number) {
  return greekShortMonthLabels[index] ?? getMonthLabel(String(index + 1));
}

function toText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: string | null | undefined) {
  return toText(value).toLocaleUpperCase("el-GR");
}

/** Matrix hierarchy: group2 → group1 (category) → group3 (optional) → team → seller. */
export function reportMatrixDetailRowsHaveGroup2(
  rows: ReportMatrixRow[],
): boolean {
  return rows.some(
    (row) => row.rowKind === "detail" && toText(row.filterValues?.group2),
  );
}

export function isRedundantGroup1Category(group2: string, group1: string) {
  return (
    Boolean(toText(group2)) &&
    normalizeKeyPart(group2) === normalizeKeyPart(group1)
  );
}

function getMatrixKey(row: PowerBiMatrixSourceRow) {
  return [
    row.group2,
    row.group1,
    row.group3,
    row.team,
    row.sellerCode || row.sellerName || "",
  ]
    .map(normalizeKeyPart)
    .join("|");
}

function addNumber(current: number, value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? current : current + value;
}

function normalizeCurrency(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? null : value;
}

function getTotalCurrencyBucket(
  value: number | null | undefined,
): TotalCurrencyBucket {
  return normalizeCurrency(value) === 0 ? 0 : 1;
}

function getTotalRowLabel(
  currency: TotalCurrencyBucket,
  showCurrencyLabel: boolean,
) {
  if (!showCurrencyLabel) return "Σύνολα";
  return currency === 0 ? "Αριθμός παραγγελιών" : "Σύνολα (€)";
}

function applyAggregateCurrency(
  aggregate: Pick<MatrixAggregate, "currency">,
  value: number | null | undefined,
) {
  const nextCurrency = normalizeCurrency(value);
  if (aggregate.currency == null && nextCurrency != null) {
    aggregate.currency = nextCurrency;
  }
}

function getMatrixKeyFromAggregate(aggregate: MatrixAggregate) {
  return [
    aggregate.group2,
    aggregate.group1,
    aggregate.group3,
    aggregate.team,
    aggregate.sellerCode || aggregate.sellerName || "",
  ]
    .map(normalizeKeyPart)
    .join("|");
}

function monthLookupKey(month: string) {
  const monthIndex = getMonthIndex(month);
  if (monthIndex != null) return `m${monthIndex}`;
  return month.trim().toLowerCase();
}

function buildLyByMatrixMonth(previousRows: PowerBiMatrixSourceRow[]) {
  const lookup = new Map<string, number>();

  for (const row of previousRows) {
    const month = toText(row.month);
    if (!month) continue;

    const key = `${getMatrixKey(row)}|${monthLookupKey(month)}`;
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vly ?? row.vcy ?? 0));
  }

  return lookup;
}

function sumAllLyForAggregate(
  aggregate: MatrixAggregate,
  lyByMatrixMonth: Map<string, number>,
) {
  const prefix = `${getMatrixKeyFromAggregate(aggregate)}|`;
  let sum = 0;

  for (const [key, value] of lyByMatrixMonth) {
    if (key.startsWith(prefix)) sum += value;
  }

  return sum;
}

function sumSamePeriodLy(
  aggregate: MatrixAggregate,
  lyByMatrixMonth: Map<string, number>,
) {
  const matrixKey = getMatrixKeyFromAggregate(aggregate);

  if (aggregate.hasClosedMonthStatus) {
    let sum = 0;
    for (const monthKey of aggregate.closedMonthKeys) {
      sum += lyByMatrixMonth.get(`${matrixKey}|${monthKey}`) ?? 0;
    }
    return sum;
  }

  return sumAllLyForAggregate(aggregate, lyByMatrixMonth);
}

export function computeMatrixLySales(
  aggregate: MatrixAggregate,
  lyByMatrixMonth: Map<string, number>,
): MatrixLySales {
  return {
    vlcAll: sumAllLyForAggregate(aggregate, lyByMatrixMonth),
    vlcSamePeriod: sumSamePeriodLy(aggregate, lyByMatrixMonth),
  };
}

function ensureAggregate(
  aggregates: Map<string, MatrixAggregate>,
  row: PowerBiMatrixSourceRow,
) {
  const key = getMatrixKey(row);
  const existing = aggregates.get(key);
  if (existing) {
    if (!existing.sellerName && row.sellerName) {
      existing.sellerName = toText(row.sellerName);
    }
    applyAggregateCurrency(existing, row.currency);
    return existing;
  }

  const aggregate: MatrixAggregate = {
    group1: toText(row.group1),
    group2: toText(row.group2),
    group3: toText(row.group3),
    team: toText(row.team),
    sellerCode: toText(row.sellerCode),
    sellerName: toText(row.sellerName),
    currency: normalizeCurrency(row.currency),
    tcyAll: 0,
    vcyAll: 0,
    tcyClosed: 0,
    vcyClosed: 0,
    vlc: 0,
    vlcAll: 0,
    vTrend: 0,
    openMonthTcyByMonth: new Map(),
    closedMonthKeys: new Set(),
    hasClosedMonthStatus: false,
  };
  aggregates.set(key, aggregate);
  return aggregate;
}

function renderSeller(aggregate: MatrixAggregate) {
  const sellerName = aggregate.sellerName || "-";
  const sellerCode = aggregate.sellerCode || "-";

  return (
    <span className="report-matrix__seller-cell">
      <span className="report-matrix__seller-name">{sellerName}</span>
      <span className="report-matrix__seller-code">{sellerCode}</span>
    </span>
  );
}

function getCategoryLabel(aggregate: MatrixAggregate, isTotal = false) {
  if (isTotal) return aggregate.group1 || "Σύνολα";
  // Category column displays group1 in the group2 → group1 → group3 hierarchy.
  return aggregate.group1 || "-";
}

function getGroup2Label(aggregate: MatrixAggregate) {
  return aggregate.group2 || "";
}

function getGroup2RowKey(group2: string) {
  return `group2:${normalizeKeyPart(group2) || "EMPTY"}`;
}

function getCategoryRowKey(group2: string, category: string) {
  return `category:${normalizeKeyPart(group2)}|${normalizeKeyPart(category)}`;
}

function getGroup3Label(aggregate: MatrixAggregate) {
  return aggregate.group3 || "";
}

function getGroup3RowKey(group2: string, category: string, group3: string) {
  return `group3:${normalizeKeyPart(group2)}|${normalizeKeyPart(category)}|${normalizeKeyPart(group3) || "EMPTY"}`;
}

function getTeamRowKey(
  group2: string,
  category: string,
  group3: string,
  team: string,
) {
  return `team:${normalizeKeyPart(group2)}|${normalizeKeyPart(category)}|${normalizeKeyPart(group3)}|${normalizeKeyPart(team)}`;
}

function countDistinctGroup3Values(rows: ReportMatrixRow[]) {
  return new Set(
    rows.map((row) => toText(row.filterValues?.group3)).filter(Boolean),
  ).size;
}

function countDistinctTeamValues(rows: ReportMatrixRow[]) {
  return new Set(
    rows.map((row) => toText(row.filterValues?.team)).filter(Boolean),
  ).size;
}

function countCategoryChildBranches(childRows: ReportMatrixRow[]) {
  if (reportMatrixDetailRowsHaveGroup3(childRows)) {
    return countDistinctGroup3Values(childRows);
  }

  const teamCount = countDistinctTeamValues(childRows);
  return teamCount > 0 ? teamCount : childRows.length;
}

export function reportMatrixDetailRowsHaveGroup3(
  rows: ReportMatrixRow[],
): boolean {
  return rows.some(
    (row) => row.rowKind === "detail" && toText(row.filterValues?.group3),
  );
}

function getOrderIndex(order: string[] | undefined, value: string) {
  if (!order?.length) return -1;

  const normalizedValue = normalizeKeyPart(value);
  return order.map((item) => normalizeKeyPart(item)).indexOf(normalizedValue);
}

function compareByOrder(
  order: string[] | undefined,
  leftValue: string,
  rightValue: string,
) {
  const leftOrder = getOrderIndex(order, leftValue);
  const rightOrder = getOrderIndex(order, rightValue);

  if (leftOrder !== rightOrder) {
    if (leftOrder === -1 && rightOrder === -1) {
      return leftValue.localeCompare(rightValue, "el");
    }
    if (leftOrder === -1) return 1;
    if (rightOrder === -1) return -1;
    return leftOrder - rightOrder;
  }

  if (leftOrder === -1) {
    return leftValue.localeCompare(rightValue, "el");
  }

  return 0;
}

function getCategoryOrderIndex(
  categoryOrder: string[] | undefined,
  category: string,
) {
  return getOrderIndex(categoryOrder, category);
}

function mergeOpenMonthMaps(
  aggregates: MatrixAggregate[],
): Map<string, number> {
  const merged = new Map<string, number>();

  for (const aggregate of aggregates) {
    for (const [month, target] of aggregate.openMonthTcyByMonth) {
      merged.set(month, (merged.get(month) ?? 0) + target);
    }
  }

  return merged;
}

function resolveAggregateCurrency(aggregates: MatrixAggregate[]) {
  const resolved = { currency: null as number | null };

  for (const aggregate of aggregates) {
    applyAggregateCurrency(resolved, aggregate.currency);
  }

  return resolved.currency;
}

function buildTotalAggregate(aggregates: MatrixAggregate[]): MatrixAggregate {
  const currency = resolveAggregateCurrency(aggregates);
  const total = aggregates.reduce<MatrixAggregate>(
    (sum, aggregate) => ({
      ...sum,
      tcyAll: sum.tcyAll + aggregate.tcyAll,
      vcyAll: sum.vcyAll + aggregate.vcyAll,
      tcyClosed: sum.tcyClosed + aggregate.tcyClosed,
      vcyClosed: sum.vcyClosed + aggregate.vcyClosed,
      vlc: sum.vlc + aggregate.vlc,
      vlcAll: sum.vlcAll + aggregate.vlcAll,
      vTrend: sum.vTrend + aggregate.vTrend,
      hasClosedMonthStatus:
        sum.hasClosedMonthStatus || aggregate.hasClosedMonthStatus,
    }),
    {
      group1: "",
      group2: "Σύνολα",
      group3: "",
      team: "-",
      sellerCode: "-",
      sellerName: "",
      currency,
      tcyAll: 0,
      vcyAll: 0,
      tcyClosed: 0,
      vcyClosed: 0,
      vlc: 0,
      vlcAll: 0,
      vTrend: 0,
      openMonthTcyByMonth: new Map(),
      closedMonthKeys: new Set(),
      hasClosedMonthStatus: false,
    },
  );

  total.openMonthTcyByMonth = mergeOpenMonthMaps(aggregates);
  return total;
}

function buildCurrencySplitTotalRows({
  aggregates,
  keyPrefix,
  labelResolver,
  parentKey,
}: CurrencySplitRowOptions): ReportMatrixRow[] {
  if (!aggregates.length) return [];

  const aggregatesByCurrency = new Map<
    TotalCurrencyBucket,
    MatrixAggregate[]
  >();

  for (const aggregate of aggregates) {
    const currency = getTotalCurrencyBucket(aggregate.currency);
    const existing = aggregatesByCurrency.get(currency);

    if (existing) {
      existing.push(aggregate);
    } else {
      aggregatesByCurrency.set(currency, [aggregate]);
    }
  }

  const visibleCurrencies = TOTAL_CURRENCY_BUCKETS.filter(
    (currency) => (aggregatesByCurrency.get(currency) ?? []).length > 0,
  );

  return visibleCurrencies.map((currency) => {
    const bucketAggregates = aggregatesByCurrency.get(currency) ?? [];
    const totalAggregate = buildTotalAggregate(bucketAggregates);

    totalAggregate.group1 = labelResolver(
      currency,
      visibleCurrencies.length > 1,
    );
    totalAggregate.group2 = "Σύνολο";
    totalAggregate.team = "";
    totalAggregate.sellerCode = "";
    totalAggregate.sellerName = "";
    totalAggregate.currency = currency;

    return aggregateToMatrixRow(totalAggregate, true, {
      extraMonthlyTargetSum: sumExtraMonthlyTarget(bucketAggregates),
      key:
        visibleCurrencies.length > 1 ? `${keyPrefix}:${currency}` : keyPrefix,
      parentKey,
      rowKind: "total",
    });
  });
}

function createEmptyMetricValues(): ReportMatrixRow["values"] {
  return {
    currentCover: false,
    currentDiff: false,
    currentTarget: false,
    currentTrend: false,
    extraMonthlyTarget: false,
    monthlyTarget: false,
    newMonthlyTarget: false,
    previousCover: false,
    previousDiff: false,
    previousResult: false,
    previousTarget: false,
    yearComparison: false,
    yearDiff: false,
    yearResult: false,
  };
}

function getClosedPeriodMetrics(aggregate: MatrixAggregate) {
  if (aggregate.hasClosedMonthStatus) {
    return {
      target: aggregate.tcyClosed,
      result: aggregate.vcyClosed,
    };
  }

  return {
    target: aggregate.tcyAll,
    result: aggregate.vcyAll,
  };
}

function computeMonthlyTargetMetrics(
  aggregate: MatrixAggregate,
): MonthlyTargetMetrics {
  const diffGap = aggregate.vTrend - aggregate.tcyAll;
  const openMonths = [...aggregate.openMonthTcyByMonth.entries()].sort(
    (left, right) => getMonthSortIndex(left[0]) - getMonthSortIndex(right[0]),
  );
  const openMonthCount = openMonths.length;
  const monthlyTarget = openMonths[0]?.[1] ?? null;
  const extraMonthlyTarget =
    diffGap > 0 || openMonthCount === 0
      ? 0
      : Math.abs(diffGap) / openMonthCount;
  const newMonthlyTarget =
    monthlyTarget == null ? null : monthlyTarget + extraMonthlyTarget;

  return {
    monthlyTarget,
    extraMonthlyTarget: monthlyTarget == null ? null : extraMonthlyTarget,
    newMonthlyTarget,
  };
}

function aggregateToMatrixRow(
  aggregate: MatrixAggregate,
  isTotal = false,
  options: MatrixRowOptions = {},
): ReportMatrixRow {
  const closedPeriod = getClosedPeriodMetrics(aggregate);
  const monthlyTargets = computeMonthlyTargetMetrics(aggregate);
  const extraMonthlyTarget =
    options.extraMonthlyTargetSum !== undefined
      ? options.extraMonthlyTargetSum
      : monthlyTargets.extraMonthlyTarget;
  const category = getCategoryLabel(aggregate, isTotal);
  const sellerLabel = isTotal
    ? EMPTY_VALUE
    : [aggregate.sellerName, aggregate.sellerCode]
        .filter(Boolean)
        .join(" - ") || "-";
  const rowKind = options.rowKind ?? (isTotal ? "total" : "detail");
  const displayCategory =
    rowKind === "group3" ? getGroup3Label(aggregate) || "-" : category;
  const includeFilterValues = !isTotal && rowKind === "detail";
  const coverMetrics = formatMatrixCoverMetrics(
    aggregate,
    closedPeriod,
    rowKind,
    isTotal,
  );
  const previousDiffValue =
    closedPeriod.target === 0 ? 0 : closedPeriod.result - closedPeriod.target;
  const currentDiffValue =
    aggregate.tcyAll === 0 ? 0 : aggregate.vTrend - aggregate.tcyAll;
  const yearDiffValue = hasYearComparisonBaseline(aggregate.vlc)
    ? closedPeriod.result - aggregate.vlc
    : 0;

  return {
    key:
      options.key ??
      (isTotal
        ? "total"
        : [
            aggregate.group2,
            aggregate.group1,
            aggregate.group3,
            aggregate.team,
            aggregate.sellerCode,
          ]
            .map(normalizeKeyPart)
            .join("|")),
    category: displayCategory,
    childCount: options.childCount,
    filterValues: includeFilterValues
      ? {
          category,
          group2: aggregate.group2,
          group3: aggregate.group3 || undefined,
          team: aggregate.team || "",
          seller: `${aggregate.sellerCode}|${aggregate.sellerName}`,
          sellerLabel,
        }
      : undefined,
    isTotal,
    parentKey: options.parentKey,
    rowKind,
    metrics: isTotal ? undefined : metricsFromAggregate(aggregate),
    leadingValues: {
      team: isTotal ? false : aggregate.team || "-",
      seller: isTotal ? false : renderSeller(aggregate),
      ...options.leadingValues,
    },
    cellTones: buildMetricCellTones({
      currentDiff: currentDiffValue,
      previousDiff: previousDiffValue,
      yearDiff: yearDiffValue,
    }),
    values: {
      currentCover: coverMetrics.currentCover,
      currentDiff: formatGapDiff(
        aggregate.vTrend,
        aggregate.tcyAll,
        aggregate,
        isTotal,
      ),
      currentTarget: formatMatrixValue(aggregate.tcyAll, aggregate, isTotal),
      currentTrend: formatMatrixValue(aggregate.vTrend, aggregate, isTotal),
      extraMonthlyTarget: formatOptionalMatrixValue(
        extraMonthlyTarget,
        aggregate,
        isTotal,
      ),
      monthlyTarget: formatOptionalMatrixValue(
        monthlyTargets.monthlyTarget,
        aggregate,
        isTotal,
      ),
      newMonthlyTarget: formatOptionalMatrixValue(
        monthlyTargets.newMonthlyTarget,
        aggregate,
        isTotal,
      ),
      previousCover: coverMetrics.previousCover,
      previousDiff: formatGapDiff(
        closedPeriod.result,
        closedPeriod.target,
        aggregate,
        isTotal,
      ),
      previousResult: formatMatrixValue(
        closedPeriod.result,
        aggregate,
        isTotal,
      ),
      previousTarget: formatMatrixValue(
        closedPeriod.target,
        aggregate,
        isTotal,
      ),
      yearComparison: formatYearComparison(closedPeriod.result, aggregate.vlc),
      yearDiff: formatYearDiff(
        closedPeriod.result,
        aggregate.vlc,
        aggregate,
        isTotal,
      ),
      yearResult: hasYearComparisonBaseline(aggregate.vlc)
        ? formatMatrixValue(aggregate.vlc, aggregate, isTotal)
        : EMPTY_VALUE,
    },
  };
}

export function buildReportMatrixGroup2Rows(
  rows: ReportMatrixRow[],
  group2Order?: string[],
): ReportMatrixRow[] {
  const groupedRows = new Map<
    string,
    { group2: string; childRows: ReportMatrixRow[] }
  >();

  for (const row of rows) {
    if (row.isTotal || row.rowKind === "group2" || !row.metrics) continue;

    const group2 = row.filterValues?.group2 || "";
    if (!group2) continue;

    const key = getGroup2RowKey(group2);
    const existing = groupedRows.get(key);

    if (existing) {
      existing.childRows.push(row);
    } else {
      groupedRows.set(key, { group2, childRows: [row] });
    }
  }

  const group2Rows = [...groupedRows.entries()].map(([key, value]) => {
    const childAggregates = value.childRows.map((row) =>
      aggregateFromMetrics(row.metrics!),
    );
    const aggregate = buildTotalAggregate(childAggregates);
    const childCount = new Set(
      value.childRows.map(
        (row) => row.filterValues?.category || String(row.category ?? "-"),
      ),
    ).size;

    aggregate.group2 = value.group2;
    aggregate.group1 = "";
    aggregate.team = "";
    aggregate.sellerCode = "";
    aggregate.sellerName = "";

    const row = aggregateToMatrixRow(aggregate, false, {
      childCount,
      extraMonthlyTargetSum: sumExtraMonthlyTarget(childAggregates),
      key,
      leadingValues: {
        team: false,
        seller: false,
      },
      rowKind: "group2",
    });

    return {
      ...row,
      category: value.group2,
    };
  });

  if (group2Order?.length) {
    group2Rows.sort((left, right) =>
      compareByOrder(
        group2Order,
        String(left.category ?? ""),
        String(right.category ?? ""),
      ),
    );
  }

  return group2Rows;
}

export function buildReportMatrixCategoryRows(
  rows: ReportMatrixRow[],
): ReportMatrixRow[] {
  const groupedRows = new Map<
    string,
    { category: string; group2: string; childRows: ReportMatrixRow[] }
  >();

  for (const row of rows) {
    if (
      row.isTotal ||
      row.rowKind === "category" ||
      row.rowKind === "group2" ||
      row.rowKind === "group3" ||
      !row.metrics
    ) {
      continue;
    }

    const category = row.filterValues?.category || String(row.category ?? "-");
    const group2 = row.filterValues?.group2 || "";
    const key = getCategoryRowKey(group2, category);
    const existing = groupedRows.get(key);

    if (existing) {
      existing.childRows.push(row);
    } else {
      groupedRows.set(key, { category, group2, childRows: [row] });
    }
  }

  return [...groupedRows.entries()].map(([key, value]) => {
    const childAggregates = value.childRows.map((row) =>
      aggregateFromMetrics(row.metrics!),
    );
    const aggregate = buildTotalAggregate(childAggregates);
    const childCount = countCategoryChildBranches(value.childRows);

    aggregate.group1 = value.category;
    aggregate.group2 = value.group2;
    aggregate.team = "";
    aggregate.sellerCode = "";
    aggregate.sellerName = "";

    return aggregateToMatrixRow(aggregate, false, {
      childCount,
      extraMonthlyTargetSum: sumExtraMonthlyTarget(childAggregates),
      key,
      leadingValues: {
        team: false,
        seller: false,
      },
      parentKey: value.group2 ? getGroup2RowKey(value.group2) : undefined,
      rowKind: "category",
    });
  });
}

export function buildReportMatrixGroup3Rows(
  rows: ReportMatrixRow[],
): ReportMatrixRow[] {
  const groupedRows = new Map<
    string,
    {
      category: string;
      group2: string;
      group3: string;
      childRows: ReportMatrixRow[];
    }
  >();

  for (const row of rows) {
    if (
      row.isTotal ||
      row.rowKind === "category" ||
      row.rowKind === "group2" ||
      row.rowKind === "group3" ||
      row.rowKind === "team" ||
      !row.metrics
    ) {
      continue;
    }

    const group3 = toText(row.filterValues?.group3);
    if (!group3) continue;

    const category = row.filterValues?.category || String(row.category ?? "-");
    const group2 = row.filterValues?.group2 || "";
    const key = getGroup3RowKey(group2, category, group3);
    const existing = groupedRows.get(key);

    if (existing) {
      existing.childRows.push(row);
    } else {
      groupedRows.set(key, { category, group2, group3, childRows: [row] });
    }
  }

  return [...groupedRows.entries()].map(([key, value]) => {
    const childAggregates = value.childRows.map((row) =>
      aggregateFromMetrics(row.metrics!),
    );
    const aggregate = buildTotalAggregate(childAggregates);

    aggregate.group1 = value.category;
    aggregate.group2 = value.group2;
    aggregate.group3 = value.group3;
    aggregate.team = "";
    aggregate.sellerCode = "";
    aggregate.sellerName = "";

    return aggregateToMatrixRow(aggregate, false, {
      childCount: value.childRows.length,
      extraMonthlyTargetSum: sumExtraMonthlyTarget(childAggregates),
      key,
      leadingValues: {
        team: false,
        seller: false,
      },
      parentKey: getCategoryRowKey(value.group2, value.category),
      rowKind: "group3",
    });
  });
}

export function buildReportMatrixTeamRows(
  rows: ReportMatrixRow[],
): ReportMatrixRow[] {
  const groupedRows = new Map<
    string,
    {
      category: string;
      group2: string;
      group3: string;
      team: string;
      childRows: ReportMatrixRow[];
    }
  >();

  for (const row of rows) {
    if (
      row.isTotal ||
      row.rowKind === "category" ||
      row.rowKind === "group2" ||
      row.rowKind === "group3" ||
      !row.metrics
    ) {
      continue;
    }

    const category = row.filterValues?.category || String(row.category ?? "-");
    const group2 = row.filterValues?.group2 || "";
    const group3 = toText(row.filterValues?.group3);
    const team = row.filterValues?.team || "";
    const key = getTeamRowKey(group2, category, group3, team);
    const existing = groupedRows.get(key);

    if (existing) {
      existing.childRows.push(row);
    } else {
      groupedRows.set(key, {
        category,
        group2,
        group3,
        team,
        childRows: [row],
      });
    }
  }

  return [...groupedRows.entries()].map(([key, value]) => {
    const childAggregates = value.childRows.map((row) =>
      aggregateFromMetrics(row.metrics!),
    );
    const aggregate = buildTotalAggregate(childAggregates);

    aggregate.group1 = value.category;
    aggregate.group2 = value.group2;
    aggregate.group3 = value.group3;
    aggregate.team = value.team;
    aggregate.sellerCode = "";
    aggregate.sellerName = "";

    return aggregateToMatrixRow(aggregate, false, {
      childCount: value.childRows.length,
      extraMonthlyTargetSum: sumExtraMonthlyTarget(childAggregates),
      key,
      leadingValues: {
        seller: false,
      },
      parentKey: value.group3
        ? getGroup3RowKey(value.group2, value.category, value.group3)
        : getCategoryRowKey(value.group2, value.category),
      rowKind: "team",
    });
  });
}

export function buildReportMatrixGroup2TotalRows(
  rows: ReportMatrixRow[],
): ReportMatrixRow[] {
  const groupedRows = new Map<string, MatrixAggregate[]>();

  for (const row of rows) {
    if (!row.metrics) continue;

    const group2 = toText(row.filterValues?.group2);
    if (!group2) continue;

    const existing = groupedRows.get(group2);
    const aggregate = aggregateFromMetrics(row.metrics);

    if (existing) {
      existing.push(aggregate);
    } else {
      groupedRows.set(group2, [aggregate]);
    }
  }

  return [...groupedRows.entries()].flatMap(([group2, aggregates]) =>
    buildCurrencySplitTotalRows({
      aggregates,
      keyPrefix: `group2-total:${normalizeKeyPart(group2)}`,
      labelResolver: getTotalRowLabel,
      parentKey: getGroup2RowKey(group2),
    }),
  );
}

export function buildReportMatrixRows({
  categoryOrder,
  currentRows,
  group2Order,
  previousRows,
  trendRows,
  sellersCatalog = [],
}: BuildReportMatrixRowsInput): ReportMatrixRow[] {
  const scopedCurrentRows = filterMatrixRowsBySellersCatalog(
    currentRows,
    sellersCatalog,
  );
  const scopedPreviousRows = filterMatrixRowsBySellersCatalog(
    previousRows,
    sellersCatalog,
  );
  const scopedTrendRows = filterMatrixRowsBySellersCatalog(
    trendRows,
    sellersCatalog,
  );
  const enrichedCurrentRows = enrichMatrixRowsWithSellers(
    scopedCurrentRows,
    sellersCatalog,
  );
  const enrichedPreviousRows = enrichMatrixRowsWithSellers(
    scopedPreviousRows,
    sellersCatalog,
  );
  const enrichedTrendRows = enrichMatrixRowsWithSellers(
    scopedTrendRows,
    sellersCatalog,
  );
  const aggregates = new Map<string, MatrixAggregate>();

  for (const row of enrichedCurrentRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.tcyAll = addNumber(aggregate.tcyAll, row.tcy);
    aggregate.vcyAll = addNumber(aggregate.vcyAll, row.vcy);

    const month = toText(row.month);
    const status = toText(row.closedMonthStatus);

    if (status) {
      aggregate.hasClosedMonthStatus = true;

      if (isClosedMonth(status)) {
        aggregate.tcyClosed = addNumber(aggregate.tcyClosed, row.tcy);
        aggregate.vcyClosed = addNumber(aggregate.vcyClosed, row.vcy);
        if (month) {
          aggregate.closedMonthKeys.add(monthLookupKey(month));
        }
      } else if (month) {
        aggregate.openMonthTcyByMonth.set(
          month,
          (aggregate.openMonthTcyByMonth.get(month) ?? 0) + (row.tcy ?? 0),
        );
      }
    }
  }

  const lyByMatrixMonth = buildLyByMatrixMonth(enrichedPreviousRows);

  for (const row of enrichedPreviousRows) {
    ensureAggregate(aggregates, row);
  }

  for (const row of enrichedTrendRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.vTrend = addNumber(aggregate.vTrend, row.vTrend);
  }

  for (const aggregate of aggregates.values()) {
    const lySales = computeMatrixLySales(aggregate, lyByMatrixMonth);
    aggregate.vlc = lySales.vlcSamePeriod;
    aggregate.vlcAll = lySales.vlcAll;
  }

  const sortedAggregates = [...aggregates.values()].sort((left, right) => {
    const group2Compare = compareByOrder(
      group2Order,
      getGroup2Label(left),
      getGroup2Label(right),
    );
    if (group2Compare !== 0) return group2Compare;

    const leftOrder = getCategoryOrderIndex(categoryOrder, left.group1);
    const rightOrder = getCategoryOrderIndex(categoryOrder, right.group1);
    if (leftOrder !== rightOrder) {
      if (leftOrder === -1) return 1;
      if (rightOrder === -1) return -1;
      return leftOrder - rightOrder;
    }

    const categoryCompare = getCategoryLabel(left).localeCompare(
      getCategoryLabel(right),
      "el",
    );
    if (categoryCompare !== 0) return categoryCompare;

    const group3Compare = getGroup3Label(left).localeCompare(
      getGroup3Label(right),
      "el",
    );
    if (group3Compare !== 0) return group3Compare;

    const teamCompare = left.team.localeCompare(right.team, "el");
    if (teamCompare !== 0) return teamCompare;

    return (left.sellerName || left.sellerCode).localeCompare(
      right.sellerName || right.sellerCode,
      "el",
    );
  });

  if (!sortedAggregates.length) return [];

  const detailRows = sortedAggregates.map((aggregate) =>
    aggregateToMatrixRow(aggregate, false, {
      parentKey: getTeamRowKey(
        getGroup2Label(aggregate),
        getCategoryLabel(aggregate),
        getGroup3Label(aggregate),
        aggregate.team,
      ),
      rowKind: "detail",
    }),
  );

  return [
    ...detailRows,
    aggregateToMatrixRow(buildTotalAggregate(sortedAggregates), true, {
      extraMonthlyTargetSum: sumExtraMonthlyTarget(sortedAggregates),
    }),
  ];
}

export function createReportMatrixSections({
  currentYear,
  previousYear,
  summaries,
}: {
  currentYear: number;
  previousYear: number;
  summaries?: ReportMatrixSectionSummaries;
}): ReportMatrixSection[] {
  const resolvedPreviousYear = previousYear || currentYear - 1;
  const currentMonthLabel =
    summaries?.["monthly-target"]?.value != null &&
    summaries?.["monthly-target"]?.value !== "-"
      ? String(summaries["monthly-target"]?.value)
      : null;
  const sections = [
    {
      key: "previous-period",
      summary: summaries?.["previous-period"],
      title: "Απολογισμός Προηγούμενου Διαστήματος",
      columns: [
        {
          key: "previousTarget",
          label: "Στόχος",
          headerTone: "danger",
          width: 82,
        },
        {
          key: "previousResult",
          label: "Αποτέλεσμα",
          headerTone: "danger",
          width: 86,
        },
        { key: "previousCover", label: "% Κάλυψη Στόχου", width: 56 },
        { key: "previousDiff", label: "# Απόκλιση από Στόχο", width: 58 },
      ],
    },
    {
      key: "year-comparison",
      summary: summaries?.["closed-months"],
      title: "Σύγκριση με Ίδιο Διάστημα Προηγούμενου Έτους",
      columns: [
        {
          key: "yearResult",
          label: `Αποτέλεσμα ${resolvedPreviousYear}`,
          headerTone: "danger",
          width: 84,
        },
        {
          key: "yearComparison",
          label: `% ${currentYear} vs ${resolvedPreviousYear}`,
          width: 68,
        },
        {
          key: "yearDiff",
          label: `# ${currentYear} vs ${resolvedPreviousYear}`,
          width: 68,
        },
      ],
    },
    {
      key: "current-year",
      summary: summaries?.["current-year"],
      title: "Προσέγγιση Τρέχοντος Έτους",
      columns: [
        {
          key: "currentTarget",
          label: `Στόχος ${currentYear}`,
          headerTone: "danger",
          width: 82,
        },
        { key: "currentTrend", label: `Τάση ${currentYear}`, width: 86 },
        {
          key: "currentCover",
          label: `% Κάλυψη Στόχου ${currentYear}`,
          width: 60,
        },
        {
          key: "currentDiff",
          label: `# Απόκλιση από Στόχο ${currentYear}`,
          width: 62,
        },
      ],
    },
    {
      key: "monthly-target",
      summary: summaries?.["monthly-target"],
      title: currentMonthLabel ? (
        <>
          Μηνιαία Προσαρμογή Στόχου: <strong>{currentMonthLabel}</strong>
        </>
      ) : (
        "Μηνιαία Προσαρμογή Στόχου"
      ),
      tone: "rose",
      columns: [
        {
          key: "monthlyTarget",
          label: "Στόχος μήνα",
          headerTone: "danger",
          width: 70,
        },
        {
          key: "extraMonthlyTarget",
          label: "Επιπλέον Στόχος / μήνα",
          width: 60,
        },
        { key: "newMonthlyTarget", label: "Νέος Στόχος / μήνα", width: 60 },
      ],
    },
  ] satisfies ReportMatrixSection[];

  return sections.map<ReportMatrixSection>((section) => ({
    ...section,
    columns: section.columns.map<ReportMatrixColumn>((column) => ({
      align: "center",
      ...column,
      width: column.width ?? 82,
    })),
  }));
}

function getUniqueMonthIndexes(
  rows: PowerBiMatrixSourceRow[],
  matcher: (row: PowerBiMatrixSourceRow) => boolean,
) {
  const monthIndexes = new Set<number>();

  for (const row of rows) {
    if (!matcher(row)) continue;

    const month = toText(row.month);
    const monthIndex = month ? getMonthIndex(month) : null;
    if (monthIndex != null) {
      monthIndexes.add(monthIndex);
    }
  }

  return [...monthIndexes].sort((left, right) => left - right);
}

function formatMonthRange(startIndex: number, endIndex: number) {
  if (startIndex === endIndex) {
    return getShortMonthLabel(startIndex);
  }

  return `${getShortMonthLabel(startIndex)} - ${getShortMonthLabel(endIndex)}`;
}

export function createReportMatrixSectionSummaries(
  rows: PowerBiMatrixSourceRow[],
): ReportMatrixSectionSummaries {
  if (!rows.length) return {};

  const closedMonthIndexes = getUniqueMonthIndexes(rows, (row) =>
    isClosedMonth(row.closedMonthStatus),
  );
  const openMonthIndexes = getUniqueMonthIndexes(rows, (row) => {
    const status = toText(row.closedMonthStatus);
    return Boolean(status) && !isClosedMonth(status);
  });

  const lastClosedMonthIndex = closedMonthIndexes.at(-1) ?? null;
  const currentMonthIndex =
    openMonthIndexes[0] ??
    (lastClosedMonthIndex != null && lastClosedMonthIndex < 11
      ? lastClosedMonthIndex + 1
      : null);
  const remainingMonths = openMonthIndexes.length;
  const currentMonthStatus =
    currentMonthIndex != null && openMonthIndexes.includes(currentMonthIndex)
      ? "Ανοιχτός"
      : currentMonthIndex != null &&
          closedMonthIndexes.includes(currentMonthIndex)
        ? "Κλειστός"
        : "-";

  const previousPeriodSummary =
    closedMonthIndexes.length && lastClosedMonthIndex != null
      ? ({
          details: [
            `Τελευταίος κλειστός: ${getShortMonthLabel(lastClosedMonthIndex)}`,
          ],
          label: "Κλειστή περίοδος",
          tone: "primary",
          value: formatMonthRange(closedMonthIndexes[0]!, lastClosedMonthIndex),
        } satisfies ReportMatrixSectionSummary)
      : undefined;

  const closedMonthsSummary =
    closedMonthIndexes.length && lastClosedMonthIndex != null
      ? ({
          details: [
            formatMonthRange(closedMonthIndexes[0]!, lastClosedMonthIndex),
          ],
          label: "ΚΛΕΙΣΤΟΙ ΜΗΝΕΣ",
          tone: "primary",
          value: String(closedMonthIndexes.length),
        } satisfies ReportMatrixSectionSummary)
      : undefined;

  const currentYearSummary =
    remainingMonths > 0
      ? ({
          details:
            currentMonthIndex != null
              ? [
                  `${formatMonthRange(
                    currentMonthIndex,
                    openMonthIndexes.at(-1) ?? currentMonthIndex,
                  )}`,
                ]
              : undefined,
          label: "Υπόλοιποι μήνες",
          tone: "success",
          value: `${remainingMonths} ${
            remainingMonths === 1 ? "μήνας" : "μήνες"
          }`,
        } satisfies ReportMatrixSectionSummary)
      : undefined;

  const monthlyTargetSummary = {
    details: [`Κατάσταση: ${currentMonthStatus}`],
    label: "Τρέχων μήνας",
    tone: "primary",
    value:
      currentMonthIndex != null ? getShortMonthLabel(currentMonthIndex) : "-",
  } satisfies ReportMatrixSectionSummary;

  return {
    "closed-months": closedMonthsSummary,
    "current-year": currentYearSummary,
    "monthly-target": monthlyTargetSummary,
    "previous-period": previousPeriodSummary,
  };
}
