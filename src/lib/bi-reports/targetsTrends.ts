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
  group2?: string;
  team: string;
  sellerCode: string;
  sellerName: string;
};

export type TargetsTrendsAnalysis = {
  summary: TargetsTrendsMetrics;
  groups: TargetsTrendsGroupMetrics[];
};

export type TargetsTrendsGrain = "group1" | "group1Group2";

export type TargetsTrendsAnalysisOptions = {
  /** Porges/BBM: aggregate at GROUP1 + GROUP2 (Excel rows 73–74). */
  grain?: TargetsTrendsGrain;
  /** Include trend-only groups in the breakdown table. */
  includeTrendOnlyGroups?: boolean;
};

type Scope = {
  team?: string;
  sellerCode?: string;
  group1?: string;
  group2?: string;
};

type ScopeRow = Pick<
  TargetsTrendsSalesRow,
  "team" | "sellerCode" | "group1" | "group2"
> & {
  sellerName?: string;
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

function monthLookupKey(month: string): string {
  const monthIndex = getMonthIndex(month);
  if (monthIndex != null) {
    return `m${monthIndex}`;
  }

  return month.trim().toLowerCase();
}

function groupKey(row: ScopeRow, grain: TargetsTrendsGrain = "group1") {
  if (grain === "group1Group2") {
    return `${row.team}|${row.sellerCode}|${row.group1}|${row.group2?.trim() ?? ""}`;
  }

  const group2 = row.group2?.trim();
  if (group2) {
    return `${row.team}|${row.sellerCode}|${row.group1}|${group2}`;
  }

  return `${row.team}|${row.sellerCode}|${row.group1}`;
}

function monthGroupKey(
  row: Pick<
    TargetsTrendsSalesRow,
    "team" | "sellerCode" | "group1" | "group2" | "month"
  >,
  grain: TargetsTrendsGrain,
) {
  return `${groupKey(row, grain)}|${monthLookupKey(row.month)}`;
}

function matchesScope(row: ScopeRow, scope: Scope): boolean {
  if (scope.team && row.team !== scope.team) return false;
  if (scope.sellerCode && row.sellerCode !== scope.sellerCode) return false;
  if (scope.group1 && row.group1 !== scope.group1) return false;
  if (scope.group2 !== undefined && (row.group2 ?? "") !== scope.group2) {
    return false;
  }
  return true;
}

function buildLyLookup(
  sales2025: TargetsTrendsSalesRow[],
  grain: TargetsTrendsGrain,
) {
  const lookup = new Map<string, number>();

  sales2025.forEach((row) => {
    const key = monthGroupKey(row, grain);
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vcy ?? 0));
  });

  return lookup;
}

function buildTrendLookup(
  trends: TargetsTrendsTrendRow[],
  grain: TargetsTrendsGrain,
) {
  const lookup = new Map<string, number>();

  trends.forEach((row) => {
    const key = groupKey(row, grain);
    lookup.set(key, (lookup.get(key) ?? 0) + (row.vTrend ?? 0));
  });

  return lookup;
}

function sumTrendTotal(
  trends: TargetsTrendsTrendRow[],
  scope: Scope,
  trendLookup: Map<string, number>,
  grain: TargetsTrendsGrain,
): number {
  const keys = new Set<string>();

  trends.forEach((row) => {
    if (matchesScope(row, scope)) {
      keys.add(groupKey(row, grain));
    }
  });

  return sum([...keys].map((key) => trendLookup.get(key) ?? 0));
}

function getMonthSortIndex(month: string): number {
  return getMonthIndex(month) ?? Number.MAX_SAFE_INTEGER;
}

function computeMetrics(
  sales2026: TargetsTrendsSalesRow[],
  trends: TargetsTrendsTrendRow[],
  scope: Scope,
  lyLookup: Map<string, number>,
  trendLookup: Map<string, number>,
  grain: TargetsTrendsGrain,
): TargetsTrendsMetrics {
  const scoped2026 = sales2026.filter((row) => matchesScope(row, scope));
  const closedRows = scoped2026.filter((row) => isClosedMonth(row.closedMonthStatus));
  const openRows = scoped2026.filter((row) => !isClosedMonth(row.closedMonthStatus));

  // Excel row 5: TARGET / SALES / DIFF / % on Completed rows.
  const closedTarget = sum(closedRows.map((row) => row.tcy));
  const closedSales = sum(closedRows.map((row) => row.vcy));
  const closedDiff = closedTarget - closedSales;
  const closedCover = ratio(closedSales, closedTarget);

  // Excel row 5: LY sales for the same closed months and group grain.
  const closedSalesLy = sum(
    closedRows.map((row) => lyLookup.get(monthGroupKey(row, grain)) ?? 0),
  );
  const closedLyCover = ratio(closedSalesLy, closedSales);
  const closedLyDiff = closedSales - closedSalesLy;

  // Excel row 5: annual TCY (all months) vs Payload Trend total.
  const annualTarget = sum(scoped2026.map((row) => row.tcy));
  const trendTotal = sumTrendTotal(trends, scope, trendLookup, grain);
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

  // Excel row 6: extra target is 0 when diff_gap > 0, else |diff_gap| / open months.
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

function registerGroupKey(
  groupKeys: Map<
    string,
    Pick<
      TargetsTrendsGroupMetrics,
      "team" | "sellerCode" | "group1" | "group2" | "sellerName"
    >
  >,
  row: ScopeRow,
  grain: TargetsTrendsGrain,
) {
  const key = groupKey(row, grain);
  if (groupKeys.has(key)) return;

  groupKeys.set(key, {
    team: row.team,
    sellerCode: row.sellerCode,
    group1: row.group1,
    group2:
      grain === "group1Group2"
        ? row.group2?.trim() || ""
        : row.group2?.trim() || undefined,
    sellerName: row.sellerName ?? "",
  });
}

export function buildTargetsTrendsAnalysis(
  sales2026: TargetsTrendsSalesRow[],
  sales2025: TargetsTrendsSalesRow[],
  trends: TargetsTrendsTrendRow[],
  options: TargetsTrendsAnalysisOptions = {},
): TargetsTrendsAnalysis {
  const grain = options.grain ?? "group1";
  const lyLookup = buildLyLookup(sales2025, grain);
  const trendLookup = buildTrendLookup(trends, grain);

  const summary = computeMetrics(
    sales2026,
    trends,
    {},
    lyLookup,
    trendLookup,
    grain,
  );

  const groupKeys = new Map<
    string,
    Pick<
      TargetsTrendsGroupMetrics,
      "team" | "sellerCode" | "group1" | "group2" | "sellerName"
    >
  >();

  sales2026.forEach((row) => registerGroupKey(groupKeys, row, grain));

  if (options.includeTrendOnlyGroups) {
    trends.forEach((row) => registerGroupKey(groupKeys, row, grain));
  }

  const groups = Array.from(groupKeys.entries())
    .map(([key, meta]) => ({
      key,
      ...meta,
      ...computeMetrics(
        sales2026,
        trends,
        meta,
        lyLookup,
        trendLookup,
        grain,
      ),
    }))
    .sort((a, b) => b.closedSales - a.closedSales);

  return { summary, groups };
}
