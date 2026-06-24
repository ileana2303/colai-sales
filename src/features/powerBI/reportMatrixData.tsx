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
import type { ReactNode } from "react";

export type PowerBiMatrixSourceRow = {
  group1?: string | null;
  group2?: string | null;
  team?: string | null;
  sellerCode?: string | null;
  sellerName?: string | null;
  month?: string | null;
  closedMonthStatus?: string | null;
  currency?: number | null;
  tcy?: number | null;
  vcy?: number | null;
  vlc?: number | null;
  vTrend?: number | null;
};

export type BuildReportMatrixRowsInput = {
  categoryOrder?: string[];
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
};

type MatrixAggregate = {
  group1: string;
  group2: string;
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
const englishShortMonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type TotalCurrencyBucket = (typeof TOTAL_CURRENCY_BUCKETS)[number];

type ReportMatrixSectionSummaries = Partial<
  Record<"current-year" | "previous-period", ReportMatrixSectionSummary>
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

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("el-GR", {
  maximumFractionDigits: 0,
});

export const reportMatrixLeadingColumns: ReportMatrixLeadingColumn[] = [
  { key: "category", label: "Κατηγορία Στόχου", width: 196 },
  { key: "team", label: "Team", width: 108 },
  { key: "seller", label: "Seller Name - Seller code", width: 168 },
];

function formatMatrixValue(
  value: number | null | undefined,
  aggregate: MatrixAggregate,
) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  if (value === 0) return "0";
  if (aggregate.currency === 0) return numberFormatter.format(value);
  return currencyFormatter.format(value);
}

function formatMatrixPercent(ratio: number | null | undefined) {
  if (ratio == null || !Number.isFinite(ratio)) return EMPTY_VALUE;
  if (ratio === 0) return "0%";
  return `${new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio * 100)}%`;
}

function formatCoverPercent(target: number, result: number) {
  if (!target || !Number.isFinite(target)) return EMPTY_VALUE;
  return formatMatrixPercent(result / target);
}

function formatGapDiff(
  result: number,
  target: number,
  aggregate: MatrixAggregate,
) {
  if (!Number.isFinite(target) || !Number.isFinite(result)) return EMPTY_VALUE;
  return formatMatrixValue(result - target, aggregate);
}

function formatYearComparison(current: number, previous: number) {
  if (!previous || !Number.isFinite(previous)) return EMPTY_VALUE;
  if (!Number.isFinite(current)) return EMPTY_VALUE;
  return formatMatrixPercent(current / previous);
}

function formatYearDiff(
  current: number,
  previous: number,
  aggregate: MatrixAggregate,
) {
  if (!Number.isFinite(current) || !Number.isFinite(previous))
    return EMPTY_VALUE;
  return formatMatrixValue(current - previous, aggregate);
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
    .filter((row) => !row.isTotal && row.rowKind !== "category" && row.metrics)
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
) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  return formatMatrixValue(value, aggregate);
}

function isClosedMonth(status?: string | null) {
  return status?.trim().toLowerCase() === "completed";
}

function getMonthSortIndex(month: string) {
  return getMonthIndex(month) ?? Number.MAX_SAFE_INTEGER;
}

function getShortMonthLabel(index: number) {
  return englishShortMonthLabels[index] ?? getMonthLabel(String(index + 1));
}

function toText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: string | null | undefined) {
  return toText(value).toLocaleUpperCase("el-GR");
}

function getMatrixKey(row: PowerBiMatrixSourceRow) {
  return [
    row.group2,
    row.group1,
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
  return currency === 0 ? "Σύνολα χωρίς νόμισμα" : "Σύνολα (€)";
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
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vlc ?? row.vcy ?? 0));
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

function getTeamRowKey(group2: string, category: string, team: string) {
  return `team:${normalizeKeyPart(group2)}|${normalizeKeyPart(category)}|${normalizeKeyPart(team)}`;
}

function getCategoryOrderIndex(
  categoryOrder: string[] | undefined,
  category: string,
) {
  if (!categoryOrder?.length) return -1;

  const normalizedCategory = normalizeKeyPart(category);
  return categoryOrder
    .map((item) => normalizeKeyPart(item))
    .indexOf(normalizedCategory);
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
  const includeFilterValues = !isTotal && rowKind === "detail";
  const previousDiffValue = closedPeriod.result - closedPeriod.target;
  const currentDiffValue = aggregate.vTrend - aggregate.tcyAll;
  const yearDiffValue = closedPeriod.result - aggregate.vlc;

  return {
    key:
      options.key ??
      (isTotal
        ? "total"
        : [
            aggregate.group2,
            aggregate.group1,
            aggregate.team,
            aggregate.sellerCode,
          ]
            .map(normalizeKeyPart)
            .join("|")),
    category,
    childCount: options.childCount,
    filterValues: includeFilterValues
      ? {
          category,
          group2: aggregate.group2,
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
      currentCover: formatCoverPercent(aggregate.tcyAll, aggregate.vTrend),
      currentDiff: formatGapDiff(aggregate.vTrend, aggregate.tcyAll, aggregate),
      currentTarget: formatMatrixValue(aggregate.tcyAll, aggregate),
      currentTrend: formatMatrixValue(aggregate.vTrend, aggregate),
      extraMonthlyTarget: formatOptionalMatrixValue(
        extraMonthlyTarget,
        aggregate,
      ),
      monthlyTarget: formatOptionalMatrixValue(
        monthlyTargets.monthlyTarget,
        aggregate,
      ),
      newMonthlyTarget: formatOptionalMatrixValue(
        monthlyTargets.newMonthlyTarget,
        aggregate,
      ),
      previousCover: formatCoverPercent(
        closedPeriod.target,
        closedPeriod.result,
      ),
      previousDiff: formatGapDiff(
        closedPeriod.result,
        closedPeriod.target,
        aggregate,
      ),
      previousResult: formatMatrixValue(closedPeriod.result, aggregate),
      previousTarget: formatMatrixValue(closedPeriod.target, aggregate),
      yearComparison: formatYearComparison(closedPeriod.result, aggregate.vlc),
      yearDiff: formatYearDiff(closedPeriod.result, aggregate.vlc, aggregate),
      yearResult: formatMatrixValue(aggregate.vlc, aggregate),
    },
  };
}

export function buildReportMatrixGroup2Rows(
  rows: ReportMatrixRow[],
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

  return [...groupedRows.entries()].map(([key, value]) => ({
    key,
    category: value.group2,
    childCount: new Set(
      value.childRows.map(
        (row) => row.filterValues?.category || String(row.category ?? "-"),
      ),
    ).size,
    leadingValues: {
      team: false,
      seller: false,
    },
    rowKind: "group2",
    values: createEmptyMetricValues(),
  }));
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

    aggregate.group1 = value.category;
    aggregate.group2 = value.group2;
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
      parentKey: value.group2 ? getGroup2RowKey(value.group2) : undefined,
      rowKind: "category",
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
      team: string;
      childRows: ReportMatrixRow[];
    }
  >();

  for (const row of rows) {
    if (
      row.isTotal ||
      row.rowKind === "category" ||
      row.rowKind === "group2" ||
      !row.metrics
    ) {
      continue;
    }

    const category = row.filterValues?.category || String(row.category ?? "-");
    const group2 = row.filterValues?.group2 || "";
    const team = row.filterValues?.team || "";
    const key = getTeamRowKey(group2, category, team);
    const existing = groupedRows.get(key);

    if (existing) {
      existing.childRows.push(row);
    } else {
      groupedRows.set(key, { category, group2, team, childRows: [row] });
    }
  }

  return [...groupedRows.entries()].map(([key, value]) => {
    const childAggregates = value.childRows.map((row) =>
      aggregateFromMetrics(row.metrics!),
    );
    const aggregate = buildTotalAggregate(childAggregates);

    aggregate.group1 = value.category;
    aggregate.group2 = value.group2;
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
      parentKey: getCategoryRowKey(value.group2, value.category),
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
  previousRows,
  trendRows,
}: BuildReportMatrixRowsInput): ReportMatrixRow[] {
  const aggregates = new Map<string, MatrixAggregate>();

  for (const row of currentRows) {
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

  const lyByMatrixMonth = buildLyByMatrixMonth(previousRows);

  for (const row of previousRows) {
    ensureAggregate(aggregates, row);
  }

  for (const row of trendRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.vTrend = addNumber(aggregate.vTrend, row.vTrend);
  }

  for (const aggregate of aggregates.values()) {
    const lySales = computeMatrixLySales(aggregate, lyByMatrixMonth);
    aggregate.vlc = lySales.vlcSamePeriod;
    aggregate.vlcAll = lySales.vlcAll;
  }

  const sortedAggregates = [...aggregates.values()].sort((left, right) => {
    const group2Compare = getGroup2Label(left).localeCompare(
      getGroup2Label(right),
      "el",
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
      title: "Μηνιαία Προσαρμογή Στόχου",
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
      align: "right",
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

  const previousPeriodSummary =
    closedMonthIndexes.length && lastClosedMonthIndex != null
      ? ({
          details: [
            `Last closed: ${getShortMonthLabel(lastClosedMonthIndex)}`,
            currentMonthIndex != null
              ? `Current month: ${getShortMonthLabel(currentMonthIndex)}`
              : "Current month: -",
          ],
          label: "Closed period",
          tone: "primary",
          value: formatMonthRange(closedMonthIndexes[0]!, lastClosedMonthIndex),
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
          label: "Remaining months",
          tone: "success",
          value: `${remainingMonths} ${
            remainingMonths === 1 ? "month" : "months"
          }`,
        } satisfies ReportMatrixSectionSummary)
      : undefined;

  return {
    "current-year": currentYearSummary,
    "previous-period": previousPeriodSummary,
  };
}
