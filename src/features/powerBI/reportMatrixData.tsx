import {
  type ReportMatrixColumn,
  type ReportMatrixLeadingColumn,
  type ReportMatrixRow,
  type ReportMatrixSection,
} from "@/features/powerBI/ReportMatrixTable";

export type PowerBiMatrixSourceRow = {
  group1?: string | null;
  group2?: string | null;
  team?: string | null;
  sellerCode?: string | null;
  sellerName?: string | null;
  tcy?: number | null;
  vcy?: number | null;
  vlc?: number | null;
  vTrend?: number | null;
};

export type BuildReportMatrixRowsInput = {
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
  tcy: number;
  vcy: number;
  vlc: number;
  vTrend: number;
};

const EMPTY_VALUE = "-";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

export const reportMatrixLeadingColumns: ReportMatrixLeadingColumn[] = [
  { key: "category", label: "Κατηγορία Στόχου", width: 180 },
  { key: "team", label: "Team", width: 78 },
  { key: "seller", label: "Seller Name - Seller code", width: 122 },
];

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return EMPTY_VALUE;
  return currencyFormatter.format(value);
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
    tcy: 0,
    vcy: 0,
    vlc: 0,
    vTrend: 0,
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

function getCategoryLabel(aggregate: MatrixAggregate) {
  return [aggregate.group2, aggregate.group1].filter(Boolean).join(" / ");
}

function buildTotalAggregate(aggregates: MatrixAggregate[]): MatrixAggregate {
  return aggregates.reduce<MatrixAggregate>(
    (total, aggregate) => ({
      ...total,
      tcy: total.tcy + aggregate.tcy,
      vcy: total.vcy + aggregate.vcy,
      vlc: total.vlc + aggregate.vlc,
      vTrend: total.vTrend + aggregate.vTrend,
    }),
    {
      group1: "",
      group2: "Σύνολα",
      team: "-",
      sellerCode: "-",
      sellerName: "",
      tcy: 0,
      vcy: 0,
      vlc: 0,
      vTrend: 0,
    },
  );
}

function aggregateToMatrixRow(
  aggregate: MatrixAggregate,
  isTotal = false,
): ReportMatrixRow {
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
    category: getCategoryLabel(aggregate),
    isTotal,
    leadingValues: {
      team: aggregate.team || "-",
      seller: isTotal ? EMPTY_VALUE : renderSeller(aggregate),
    },
    values: {
      currentCover: EMPTY_VALUE,
      currentDiff: EMPTY_VALUE,
      currentTarget: formatCurrency(aggregate.tcy),
      currentTrend: formatCurrency(aggregate.vTrend),
      extraMonthlyTarget: EMPTY_VALUE,
      monthlyTarget: EMPTY_VALUE,
      newMonthlyTarget: EMPTY_VALUE,
      previousCover: EMPTY_VALUE,
      previousDiff: EMPTY_VALUE,
      previousResult: formatCurrency(aggregate.vcy),
      previousTarget: formatCurrency(aggregate.tcy),
      yearComparison: EMPTY_VALUE,
      yearDiff: EMPTY_VALUE,
      yearResult: formatCurrency(aggregate.vlc),
    },
  };
}

export function buildReportMatrixRows({
  currentRows,
  previousRows,
  trendRows,
}: BuildReportMatrixRowsInput): ReportMatrixRow[] {
  const aggregates = new Map<string, MatrixAggregate>();

  for (const row of currentRows) {
    const aggregate = ensureAggregate(aggregates, row);
    aggregate.tcy = addNumber(aggregate.tcy, row.tcy);
    aggregate.vcy = addNumber(aggregate.vcy, row.vcy);
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
