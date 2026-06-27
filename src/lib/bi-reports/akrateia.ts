import {
  normalizeCurrentYearSalesRows,
  type CurrentYearSalesRow,
} from "@/lib/bi-reports/currentYearSales";
import {
  normalizeLastYearSalesRows,
  type LastYearSalesRow,
} from "@/lib/bi-reports/lastYearSales";
import {
  normalizeTrendSalesRows,
  type TrendSalesRow,
} from "@/lib/bi-reports/trendSales";
import {
  buildCalendarYearFilter,
  CURRENT_CALENDAR_YEAR_DAX,
  escapeDaxString,
  indentDaxArgs,
  joinDaxQuery,
  LAST_CALENDAR_YEAR_DAX,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";

type AkrateiaCategory = {
  businessUnit: "COLOPLAST" | "PORGES";
  currency: 0 | 1;
  group1?: string;
  group1Expression?: string;
  group2: string;
  groupByColumns?: string[];
  reportCode: string;
  reportDesc: string;
  rowFilterTarget: string;
  sales2025Value: string;
  sales2026Target: string;
  sales2026Value: string;
  trendValue: string;
  filters?: string[];
  summarizeSellerCodeOnly?: boolean;
  currentYearFullPersonColumns?: boolean;
  lastYearGroup1?: string;
  lastYearGroup2?: string;
  lastYearReportDesc?: string;
  lastYearCalendarFilter?: boolean;
  currentYearCalendarFilter?: boolean;
  trendGroup1?: string;
  trendGroup2?: string;
  trendReportDesc?: string;
  trendCalendarFilter?: boolean;
};

type AkrateiaQueryKind = "currentYear" | "lastYear" | "trend";

type ResolvedAkrateiaQuery = {
  calendarYear?: "current" | "last";
  fullPersonColumns: boolean;
  group1?: string;
  group1Expression?: string;
  group2: string;
  reportDesc: string;
  summarizeSellerCodeOnly: boolean;
};

export type AkrateiaSalesRow = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  group1: string;
  group2: string;
  month: string;
  closedMonthStatus?: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vcy: number | null;
  vlc?: number | null;
  tcy?: number | null;
};

export type AkrateiaTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  group1: string;
  group2: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vTrend: number | null;
};

export const AKRATEIA_GROUP2_ORDER = [
  "IC",
  "PERISTEEN",
  "CC",
  "CC SALES",
  "FOLEY",
];

export const AKRATEIA_CATEGORY_ORDER = [
  "IC",
  "IC-RESTART",
  "ICST",
  "PERISTEEN",
  "CC",
  "CC SALES",
  "FOLEY",
];

const IC_TYPES = ["IC", "IC-RESTART", "ICST"];

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

const AKRATEIA_CATEGORIES: AkrateiaCategory[] = [
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    filters: [
      `FILTER('U IC', 'U IC'[IC_TYPE] IN {${quoteDaxStrings(IC_TYPES)}})`,
    ],
    group1Expression: "'U IC'[IC_TYPE]",
    group2: "IC",
    groupByColumns: ["'U IC'[IC_TYPE]"],
    reportCode: "P02V01",
    reportDesc: "IC ",
    rowFilterTarget: "[IC PER TARGET]",
    sales2025Value: "[IC PER]",
    sales2026Target: "ROUND([IC PER TARGET], 0)",
    sales2026Value: "[IC PER]",
    summarizeSellerCodeOnly: true,
    trendCalendarFilter: true,
    trendValue: "ROUND([IC PER FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    currentYearCalendarFilter: true,
    group1: "PERISTEEN",
    group2: "PERISTEEN",
    lastYearCalendarFilter: true,
    reportCode: "P02V02",
    reportDesc: "PERISTEEN ",
    rowFilterTarget: "[PC PER TARGET]",
    sales2025Value: "[PC PER]",
    sales2026Target: "ROUND([PC PER TARGET], 0)",
    sales2026Value: "[PC PER]",
    summarizeSellerCodeOnly: true,
    trendCalendarFilter: true,
    trendValue: "ROUND([PC PER FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    currentYearCalendarFilter: true,
    group1: "CC",
    group2: "CC",
    lastYearCalendarFilter: true,
    reportCode: "P02V03",
    reportDesc: "CC ",
    rowFilterTarget: "[CC EKTEL TARGET]",
    sales2025Value: "[CC EKTEL]",
    sales2026Target: "ROUND([CC EKTEL TARGET], 0)",
    sales2026Value: "[CC EKTEL]",
    summarizeSellerCodeOnly: true,
    trendCalendarFilter: true,
    trendValue: "ROUND([CC EKTEL FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 1,
    currentYearCalendarFilter: true,
    group1: "CC SALES",
    group2: "CC SALES",
    lastYearCalendarFilter: true,
    reportCode: "P02V04",
    reportDesc: "CC SALES ",
    rowFilterTarget: "[CC SALES TARGET]",
    sales2025Value: "[CC SALES]",
    sales2026Target: "ROUND([CC SALES TARGET], 0)",
    sales2026Value: "[CC SALES]",
    summarizeSellerCodeOnly: true,
    trendCalendarFilter: true,
    trendValue: "ROUND([CC SALES FORECAST], 0)",
  },
  {
    businessUnit: "PORGES",
    currency: 1,
    currentYearCalendarFilter: true,
    group1: "FOLEY",
    group2: "FOLEY",
    lastYearCalendarFilter: true,
    reportCode: "P02V05",
    reportDesc: "FOLEY ",
    rowFilterTarget: "[monimoi sales Target]",
    sales2025Value: "[monimoi Sales]",
    sales2026Target: "[monimoi sales Target]",
    sales2026Value: "[monimoi Sales]",
    summarizeSellerCodeOnly: true,
    trendCalendarFilter: true,
    trendValue: "[Monimoi Sales Forecast]",
  },
];

function resolveAkrateiaQuery(
  category: AkrateiaCategory,
  kind: AkrateiaQueryKind,
): ResolvedAkrateiaQuery {
  switch (kind) {
    case "currentYear":
      return {
        group1: category.group1,
        group1Expression: category.group1Expression,
        group2: category.group2,
        reportDesc: category.reportDesc,
        summarizeSellerCodeOnly:
          category.currentYearFullPersonColumns === true
            ? false
            : (category.summarizeSellerCodeOnly ?? false),
        calendarYear: category.currentYearCalendarFilter ? "current" : undefined,
        fullPersonColumns: category.currentYearFullPersonColumns === true,
      };
    case "lastYear":
      return {
        group1: category.lastYearGroup1 ?? category.group1,
        group1Expression: category.lastYearGroup1
          ? undefined
          : category.group1Expression,
        group2: category.lastYearGroup2 ?? category.group2,
        reportDesc: category.lastYearReportDesc ?? category.reportDesc,
        summarizeSellerCodeOnly: category.lastYearGroup1
          ? true
          : (category.summarizeSellerCodeOnly ?? false),
        calendarYear:
          category.lastYearCalendarFilter || category.lastYearGroup1
            ? "last"
            : undefined,
        fullPersonColumns: false,
      };
    case "trend":
      return {
        group1:
          category.trendGroup1 ?? category.lastYearGroup1 ?? category.group1,
        group1Expression:
          category.trendGroup1 || category.lastYearGroup1
            ? undefined
            : category.group1Expression,
        group2:
          category.trendGroup2 ?? category.lastYearGroup2 ?? category.group2,
        reportDesc:
          category.trendReportDesc ??
          category.lastYearReportDesc ??
          category.reportDesc,
        summarizeSellerCodeOnly:
          category.trendGroup1 ||
          category.lastYearGroup1 ||
          category.summarizeSellerCodeOnly
            ? true
            : false,
        calendarYear: category.trendCalendarFilter ? "current" : undefined,
        fullPersonColumns: false,
      };
  }
}

function buildBaseArgs(
  areaName: string,
  category: AkrateiaCategory,
  query: ResolvedAkrateiaQuery,
  options: {
    includeClosedMonthStatus?: boolean;
    includeMonth?: boolean;
  },
) {
  const args = query.summarizeSellerCodeOnly
    ? ["'U Sales Person'[SellerCode]"]
    : [
        "'U Sales Person'[Area]",
        "'U Sales Person'[Team]",
        "'U Sales Person'[SellerCode]",
        "'U Sales Person'[Πωλητής]",
      ];

  if (options.includeMonth) {
    args.push("'U Months'[Month]");
  }

  if (options.includeClosedMonthStatus) {
    args.push("'U Months'[Status of Closed Month]");
  }

  if (category.groupByColumns?.length) {
    args.push(...category.groupByColumns);
  }

  args.push(
    `FILTER('UBussiness', 'UBussiness'[BusinessUnit] = "${category.businessUnit}")`,
  );

  if (category.filters?.length) {
    args.push(...category.filters);
  }

  args.push(
    `FILTER('U Sales Person', 'U Sales Person'[Area] = "${escapeDaxString(
      areaName,
    )}")`,
  );

  if (query.calendarYear === "last") {
    args.push(buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX));
  }

  if (query.calendarYear === "current") {
    args.push(buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX));
  }

  if (query.group1) {
    args.push(`"Group1", "${escapeDaxString(query.group1)}"`);
  }

  args.push(`"Group2", "${escapeDaxString(query.group2)}"`);

  return args;
}

function getGroup1SelectExpression(query: ResolvedAkrateiaQuery) {
  return query.group1Expression ?? "[Group1]";
}

function getSalesOrderBy(query: ResolvedAkrateiaQuery): string {
  if (query.fullPersonColumns) {
    return "ORDER BY [Area], [Team], [SellerName], [Month]";
  }

  if (query.summarizeSellerCodeOnly) {
    return "ORDER BY [SellerCode], [Month]";
  }

  return "ORDER BY [SellerCode], [Group1], [Group2], [Month]";
}

function getTrendOrderBy(query: ResolvedAkrateiaQuery): string {
  if (query.summarizeSellerCodeOnly) {
    return "ORDER BY [SellerCode]";
  }

  return "ORDER BY [SellerCode], [Group1], [Group2]";
}

function buildAkrateiaSalesCurrentYearQuery(
  areaName: string,
  category: AkrateiaCategory,
): string {
  const query = resolveAkrateiaQuery(category, "currentYear");
  const args = [
    ...buildBaseArgs(areaName, category, query, {
      includeClosedMonthStatus: true,
      includeMonth: true,
    }),
    `"REPORT_CODE", "${category.reportCode}-VCYTCY"`,
    `"REPORT_DESC", "${escapeDaxString(query.reportDesc)}"`,
    `"VCY", ${category.sales2026Value}`,
    `"TCY", ${category.sales2026Target}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(query);
  const selectColumns = query.fullPersonColumns
    ? [
        '  "Area", COALESCE(\'U Sales Person\'[Area], "ΔΕΝ ΟΡΙΖΕΤΑΙ"),',
        '  "Team", \'U Sales Person\'[Team],',
        '  "SellerCode", \'U Sales Person\'[SellerCode],',
        '  "SellerName", \'U Sales Person\'[Πωλητής],',
        `  "Group1", ${group1},`,
        '  "Group2", [Group2],',
        '  "Month", \'U Months\'[Month],',
        '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
        '  "REPORT_CODE", [REPORT_CODE],',
        '  "REPORT_DESC", [REPORT_DESC],',
        '  "VCY", [VCY],',
        '  "TCY", [TCY],',
        '  "CURRENCY", [CURRENCY]',
      ]
    : [
        '  "SellerCode", \'U Sales Person\'[SellerCode],',
        `  "Group1", ${group1},`,
        '  "Group2", [Group2],',
        '  "Month", \'U Months\'[Month],',
        '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
        '  "REPORT_CODE", [REPORT_CODE],',
        '  "REPORT_DESC", [REPORT_DESC],',
        '  "Currency", [CURRENCY],',
        '  "VCY", [VCY],',
        '  "TCY", [TCY]',
      ];

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    ...selectColumns,
    ")",
    getSalesOrderBy(query),
  ]);
}

function buildAkrateiaSalesLastYearQuery(
  areaName: string,
  category: AkrateiaCategory,
): string {
  const query = resolveAkrateiaQuery(category, "lastYear");
  const args = [
    ...buildBaseArgs(areaName, category, query, { includeMonth: true }),
    `"REPORT_CODE", "${category.reportCode}-VLY"`,
    `"REPORT_DESC", "${escapeDaxString(query.reportDesc)}"`,
    `"VLY", ${category.sales2025Value}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(query);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    `  "Group1", ${group1},`,
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VLY", [VLY]',
    ")",
    getSalesOrderBy(query),
  ]);
}

function buildAkrateiaTrendCurrentYearQuery(
  areaName: string,
  category: AkrateiaCategory,
): string {
  const query = resolveAkrateiaQuery(category, "trend");
  const args = [
    ...buildBaseArgs(areaName, category, query, {}),
    `"REPORT_CODE", "${category.reportCode}-VTREND"`,
    `"REPORT_DESC", "${escapeDaxString(query.reportDesc)}"`,
    `"VTREND", ${category.trendValue}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(query);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    `  "Group1", ${group1},`,
    '  "Group2", [Group2],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VTrend", [VTREND]',
    ")",
    getTrendOrderBy(query),
  ]);
}

export function buildAkrateiaSalesCurrentYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) =>
    buildAkrateiaSalesCurrentYearQuery(areaName, category),
  );
}

export function buildAkrateiaSalesLastYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) =>
    buildAkrateiaSalesLastYearQuery(areaName, category),
  );
}

export function buildAkrateiaTrendCurrentYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) =>
    buildAkrateiaTrendCurrentYearQuery(areaName, category),
  );
}

export function normalizeAkrateiaSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizeAkrateiaSalesCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizeAkrateiaTrendCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
