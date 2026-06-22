import {
  type ReportMatrixColumn,
  type ReportMatrixLeadingColumn,
  type ReportMatrixRow,
  type ReportMatrixRowMetrics,
  type ReportMatrixSection,
  type ReportMatrixTone,
} from "@/features/powerBI/ReportMatrixTable";
import {
  formatNullableRatioPercent,
  getMonthIndex,
} from "@/lib/bi-reports/reportUtils";

export type PowerBiMatrixSourceRow = {
  group1?: string | null;
  group2?: string | null;
  team?: string | null;
  sellerCode?: string | null;
  sellerName?: string | null;
  month?: string | null;
  closedMonthStatus?: string | null;
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
  tcyAll: number;
  vcyAll: number;
  tcyClosed: number;
  vcyClosed: number;
  vlc: number;
  vTrend: number;
  openMonthTcyByMonth: Map<string, number>;
  hasClosedMonthStatus: boolean;
};

type MonthlyTargetMetrics = {
  extraMonthlyTarget: number | null;
  monthlyTarget: number | null;
  newMonthlyTarget: number | null;
};

const EMPTY_VALUE = "-";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

export const reportMatrixLeadingColumns: ReportMatrixLeadingColumn[] = [
  { key: "category", label: "Κατηγορία Στόχου", width: 196 },
  { key: "team", label: "Team", width: 108 },
  { key: "seller", label: "Seller Name - Seller code", width: 168 },
];

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  return currencyFormatter.format(value);
}

function formatCoverPercent(target: number, result: number) {
  if (!target || !Number.isFinite(target)) return EMPTY_VALUE;
  return formatNullableRatioPercent(result / target);
}

function formatTargetDiff(target: number, result: number) {
  if (!Number.isFinite(target) || !Number.isFinite(result)) return EMPTY_VALUE;
  return formatCurrency(target - result);
}

function formatGapDiff(result: number, target: number) {
  if (!Number.isFinite(target) || !Number.isFinite(result)) return EMPTY_VALUE;
  return formatCurrency(result - target);
}

function formatYearComparison(current: number, previous: number) {
  if (!previous || !Number.isFinite(previous)) return EMPTY_VALUE;
  return formatNullableRatioPercent(previous / current);
}

function formatYearDiff(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous))
    return EMPTY_VALUE;
  return formatCurrency(current - previous);
}

function getDiffTone(value: number): ReportMatrixTone | undefined {
  if (!Number.isFinite(value) || value === 0) return undefined;
  return value > 0 ? "success" : "danger";
}

function buildDiffCellTones(values: {
  currentDiff: number;
  previousDiff: number;
  yearDiff: number;
}) {
  const cellTones: Record<string, ReportMatrixTone> = {};

  for (const [key, value] of Object.entries(values) as Array<
    [keyof typeof values, number]
  >) {
    const tone = getDiffTone(value);
    if (tone) {
      cellTones[key] = tone;
    }
  }

  return Object.keys(cellTones).length ? cellTones : undefined;
}

function metricsFromAggregate(
  aggregate: MatrixAggregate,
): ReportMatrixRowMetrics {
  return {
    tcyAll: aggregate.tcyAll,
    vcyAll: aggregate.vcyAll,
    tcyClosed: aggregate.tcyClosed,
    vcyClosed: aggregate.vcyClosed,
    vlc: aggregate.vlc,
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
    tcyAll: metrics.tcyAll,
    vcyAll: metrics.vcyAll,
    tcyClosed: metrics.tcyClosed,
    vcyClosed: metrics.vcyClosed,
    vlc: metrics.vlc,
    vTrend: metrics.vTrend,
    hasClosedMonthStatus: metrics.hasClosedMonthStatus,
    openMonthTcyByMonth: new Map(Object.entries(metrics.openMonthTcyByMonth)),
  };
}

export function buildReportMatrixTotalRow(
  rows: ReportMatrixRow[],
): ReportMatrixRow | null {
  const aggregates = rows
    .filter((row) => !row.isTotal && row.metrics)
    .map((row) => aggregateFromMetrics(row.metrics!));

  if (!aggregates.length) return null;

  return aggregateToMatrixRow(buildTotalAggregate(aggregates), true);
}

function formatOptionalCurrency(value: number | null) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  return formatCurrency(value);
}

function isClosedMonth(status?: string | null) {
  return status?.trim().toLowerCase() === "completed";
}

function getMonthSortIndex(month: string) {
  return getMonthIndex(month) ?? Number.MAX_SAFE_INTEGER;
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
    return existing;
  }

  const aggregate: MatrixAggregate = {
    group1: toText(row.group1),
    group2: toText(row.group2),
    team: toText(row.team),
    sellerCode: toText(row.sellerCode),
    sellerName: toText(row.sellerName),
    tcyAll: 0,
    vcyAll: 0,
    tcyClosed: 0,
    vcyClosed: 0,
    vlc: 0,
    vTrend: 0,
    openMonthTcyByMonth: new Map(),
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
  if (isTotal) return "Σύνολα";
  return aggregate.group1 || "-";
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

function buildTotalAggregate(aggregates: MatrixAggregate[]): MatrixAggregate {
  const total = aggregates.reduce<MatrixAggregate>(
    (sum, aggregate) => ({
      ...sum,
      tcyAll: sum.tcyAll + aggregate.tcyAll,
      vcyAll: sum.vcyAll + aggregate.vcyAll,
      tcyClosed: sum.tcyClosed + aggregate.tcyClosed,
      vcyClosed: sum.vcyClosed + aggregate.vcyClosed,
      vlc: sum.vlc + aggregate.vlc,
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
      tcyAll: 0,
      vcyAll: 0,
      tcyClosed: 0,
      vcyClosed: 0,
      vlc: 0,
      vTrend: 0,
      openMonthTcyByMonth: new Map(),
      hasClosedMonthStatus: false,
    },
  );

  total.openMonthTcyByMonth = mergeOpenMonthMaps(aggregates);
  return total;
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
): ReportMatrixRow {
  const closedPeriod = getClosedPeriodMetrics(aggregate);
  const monthlyTargets = computeMonthlyTargetMetrics(aggregate);
  const category = getCategoryLabel(aggregate, isTotal);
  const sellerLabel = isTotal
    ? EMPTY_VALUE
    : [aggregate.sellerName, aggregate.sellerCode]
        .filter(Boolean)
        .join(" - ") || "-";
  const previousDiffValue = closedPeriod.target - closedPeriod.result;
  const currentDiffValue = aggregate.vTrend - aggregate.tcyAll;
  const yearDiffValue = closedPeriod.result - aggregate.vlc;

  return {
    key: isTotal
      ? "total"
      : [
          aggregate.group2,
          aggregate.group1,
          aggregate.team,
          aggregate.sellerCode,
        ]
          .map(normalizeKeyPart)
          .join("|"),
    category,
    filterValues: isTotal
      ? undefined
      : {
          category,
          team: aggregate.team || "",
          seller: `${aggregate.sellerCode}|${aggregate.sellerName}`,
          sellerLabel,
        },
    isTotal,
    metrics: isTotal ? undefined : metricsFromAggregate(aggregate),
    leadingValues: {
      team: aggregate.team || "-",
      seller: isTotal ? EMPTY_VALUE : renderSeller(aggregate),
    },
    cellTones: buildDiffCellTones({
      currentDiff: currentDiffValue,
      previousDiff: previousDiffValue,
      yearDiff: yearDiffValue,
    }),
    values: {
      currentCover: formatCoverPercent(aggregate.tcyAll, aggregate.vTrend),
      currentDiff: formatGapDiff(aggregate.vTrend, aggregate.tcyAll),
      currentTarget: formatCurrency(aggregate.tcyAll),
      currentTrend: formatCurrency(aggregate.vTrend),
      extraMonthlyTarget: formatOptionalCurrency(
        monthlyTargets.extraMonthlyTarget,
      ),
      monthlyTarget: formatOptionalCurrency(monthlyTargets.monthlyTarget),
      newMonthlyTarget: formatOptionalCurrency(monthlyTargets.newMonthlyTarget),
      previousCover: formatCoverPercent(
        closedPeriod.target,
        closedPeriod.result,
      ),
      previousDiff: formatTargetDiff(closedPeriod.target, closedPeriod.result),
      previousResult: formatCurrency(closedPeriod.result),
      previousTarget: formatCurrency(closedPeriod.target),
      yearComparison: formatYearComparison(closedPeriod.result, aggregate.vlc),
      yearDiff: formatYearDiff(closedPeriod.result, aggregate.vlc),
      yearResult: formatCurrency(aggregate.vlc),
    },
  };
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
      } else if (month) {
        aggregate.openMonthTcyByMonth.set(
          month,
          (aggregate.openMonthTcyByMonth.get(month) ?? 0) + (row.tcy ?? 0),
        );
      }
    }
  }

  for (const row of previousRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.vlc = addNumber(aggregate.vlc, row.vlc ?? row.vcy);
  }

  for (const row of trendRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.vTrend = addNumber(aggregate.vTrend, row.vTrend);
  }

  const sortedAggregates = [...aggregates.values()].sort((left, right) => {
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

  return [
    ...sortedAggregates.map((aggregate) => aggregateToMatrixRow(aggregate)),
    aggregateToMatrixRow(buildTotalAggregate(sortedAggregates), true),
  ];
}

export function createReportMatrixSections({
  currentYear,
  previousYear,
}: {
  currentYear: number;
  previousYear: number;
}): ReportMatrixSection[] {
  const sections = [
    {
      key: "previous-period",
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
          label: `Αποτέλεσμα ${previousYear}`,
          headerTone: "danger",
          width: 84,
        },
        {
          key: "yearComparison",
          label: `% ${currentYear} vs ${previousYear}`,
          width: 68,
        },
        {
          key: "yearDiff",
          label: `# ${currentYear} vs ${previousYear}`,
          width: 68,
        },
      ],
    },
    {
      key: "current-year",
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
