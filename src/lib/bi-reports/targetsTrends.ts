import { getMonthIndex } from "@/lib/bi-reports/reportUtils";

export type TargetsTrendsSalesRow = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName?: string;
  group1: string;
  group2?: string;
  month: string;
  closedMonthStatus?: string;
  vcy: number | null;
  tcy?: number | null;
};

export type TargetsTrendsTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  group1: string;
  group2?: string;
  vTrend: number | null;
};

export type TargetsTrendsMetrics = {
  closedTarget: number;
  closedSales: number;
  closedDiff: number;
  closedCover: number | null;
  closedSalesLy: number;
  closedLyCover: number | null;
  closedLyDiff: number;
  annualTarget: number;
  trendTotal: number;
  diffGap: number;
  trendCover: number | null;
  openMonthCount: number;
  minOpenMonth: string | null;
  minOpenMonthTarget: number | null;
  extraTarget: number;
  adjustedOpenTarget: number | null;
  maxClosedMonth: string | null;
};

export type TargetsTrendsGroupMetrics = TargetsTrendsMetrics & {
  key: string;
  group1: string;
  team: string;
  sellerCode: string;
  sellerName: string;
};

export type TargetsTrendsAnalysis = {
  summary: TargetsTrendsMetrics;
  groups: TargetsTrendsGroupMetrics[];
};

type Scope = {
  team?: string;
  sellerCode?: string;
  group1?: string;
};

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>(
    (total, value) => total + (value ?? 0),
    0,
  );
}

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

function isClosedMonth(status?: string): boolean {
  return status?.trim().toLowerCase() === "completed";
}

function normalizeMonth(month: string): string {
  return month.trim();
}

function groupKey(row: Pick<TargetsTrendsSalesRow, "team" | "sellerCode" | "group1">) {
  return `${row.team}|${row.sellerCode}|${row.group1}`;
}

function monthGroupKey(
  row: Pick<TargetsTrendsSalesRow, "team" | "sellerCode" | "group1" | "month">,
) {
  return `${groupKey(row)}|${normalizeMonth(row.month)}`;
}

function matchesScope(row: TargetsTrendsSalesRow, scope: Scope): boolean {
  if (scope.team && row.team !== scope.team) return false;
  if (scope.sellerCode && row.sellerCode !== scope.sellerCode) return false;
  if (scope.group1 && row.group1 !== scope.group1) return false;
  return true;
}

function buildLyLookup(sales2025: TargetsTrendsSalesRow[]) {
  const lookup = new Map<string, number>();

  sales2025.forEach((row) => {
    const key = monthGroupKey(row);
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vcy ?? 0));
  });

  return lookup;
}

function buildTrendLookup(trends: TargetsTrendsTrendRow[]) {
  const lookup = new Map<string, number>();

  trends.forEach((row) => {
    const key = groupKey(row);
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vTrend ?? 0));
  });

  return lookup;
}

function getMonthSortIndex(month: string): number {
  return getMonthIndex(month) ?? Number.MAX_SAFE_INTEGER;
}

function computeMetrics(
  sales2026: TargetsTrendsSalesRow[],
  sales2025: TargetsTrendsSalesRow[],
  trends: TargetsTrendsTrendRow[],
  scope: Scope,
  lyLookup: Map<string, number>,
  trendLookup: Map<string, number>,
): TargetsTrendsMetrics {
  const scoped2026 = sales2026.filter((row) => matchesScope(row, scope));
  const closedRows = scoped2026.filter((row) => isClosedMonth(row.closedMonthStatus));
  const openRows = scoped2026.filter((row) => !isClosedMonth(row.closedMonthStatus));

  const closedTarget = sum(closedRows.map((row) => row.tcy));
  const closedSales = sum(closedRows.map((row) => row.vcy));
  const closedDiff = closedTarget - closedSales;
  const closedCover = ratio(closedSales, closedTarget);

  const closedSalesLy = sum(
    closedRows.map((row) => lyLookup.get(monthGroupKey(row)) ?? 0),
  );
  const closedLyCover = ratio(closedSalesLy, closedSales);
  const closedLyDiff = closedSales - closedSalesLy;

  const annualTarget = sum(scoped2026.map((row) => row.tcy));
  const trendTotal = sum(
    Array.from(
      new Set(scoped2026.map((row) => groupKey(row))),
    ).map((key) => trendLookup.get(key) ?? 0),
  );
  const diffGap = trendTotal - annualTarget;
  const trendCover = ratio(trendTotal, annualTarget);

  const openMonths = Array.from(
    new Set(openRows.map((row) => normalizeMonth(row.month)).filter(Boolean)),
  ).sort((a, b) => getMonthSortIndex(a) - getMonthSortIndex(b));

  const openMonthCount = openMonths.length;
  const minOpenMonth = openMonths[0] ?? null;
  const minOpenMonthTarget = minOpenMonth
    ? sum(
        openRows
          .filter((row) => normalizeMonth(row.month) === minOpenMonth)
          .map((row) => row.tcy),
      )
    : null;

  const extraTarget =
    diffGap > 0 || openMonthCount === 0 ? 0 : Math.abs(diffGap) / openMonthCount;
  const adjustedOpenTarget =
    minOpenMonthTarget == null ? null : minOpenMonthTarget + extraTarget;

  const closedMonths = Array.from(
    new Set(closedRows.map((row) => normalizeMonth(row.month)).filter(Boolean)),
  ).sort((a, b) => getMonthSortIndex(a) - getMonthSortIndex(b));
  const maxClosedMonth = closedMonths.at(-1) ?? null;

  return {
    closedTarget,
    closedSales,
    closedDiff,
    closedCover,
    closedSalesLy,
    closedLyCover,
    closedLyDiff,
    annualTarget,
    trendTotal,
    diffGap,
    trendCover,
    openMonthCount,
    minOpenMonth,
    minOpenMonthTarget,
    extraTarget,
    adjustedOpenTarget,
    maxClosedMonth,
  };
}

export function buildTargetsTrendsAnalysis(
  sales2026: TargetsTrendsSalesRow[],
  sales2025: TargetsTrendsSalesRow[],
  trends: TargetsTrendsTrendRow[],
): TargetsTrendsAnalysis {
  const lyLookup = buildLyLookup(sales2025);
  const trendLookup = buildTrendLookup(trends);

  const summary = computeMetrics(
    sales2026,
    sales2025,
    trends,
    {},
    lyLookup,
    trendLookup,
  );

  const groupKeys = new Map<
    string,
    Pick<TargetsTrendsGroupMetrics, "team" | "sellerCode" | "group1" | "sellerName">
  >();

  sales2026.forEach((row) => {
    const key = groupKey(row);
    if (!groupKeys.has(key)) {
      groupKeys.set(key, {
        team: row.team,
        sellerCode: row.sellerCode,
        group1: row.group1,
        sellerName: row.sellerName ?? "",
      });
    }
  });

  const groups = Array.from(groupKeys.entries())
    .map(([key, meta]) => ({
      key,
      ...meta,
      ...computeMetrics(
        sales2026,
        sales2025,
        trends,
        meta,
        lyLookup,
        trendLookup,
      ),
    }))
    .sort((a, b) => b.closedSales - a.closedSales);

  return { summary, groups };
}
