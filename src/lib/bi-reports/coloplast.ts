import type { BiReportPowerBiTargetKey } from "@/lib/bi-reports/biReports";
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
  escapeDaxString,
  indentDaxArgs,
  joinDaxQuery,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";

type ColoplastCategory = {
  businessUnit: "COLOPLAST" | "GENADYNE";
  currency: 0 | 1;
  group1?: string;
  group1Expression?: string;
  group2: string;
  groupByColumns?: string[];
  key: string;
  label: string;
  previousTargetKey?: BiReportPowerBiTargetKey;
  reportCode: string;
  reportDesc: string;
  rowFilterTarget: string;
  sales2025Value: string;
  sales2026Target: string;
  sales2026Value: string;
  trendTargetKey?: BiReportPowerBiTargetKey;
  trendValue: string;
  filters?: string[];
  /** Summarize by seller code only (no area/team/name columns). */
  summarizeSellerCodeOnly?: boolean;
  /** Apply Calendar year filters in DAX (last year / current year). */
  useCalendarYearFilter?: boolean;
};

export type ColoplastQuerySpec = {
  label: string;
  query: string;
  targetKey: BiReportPowerBiTargetKey;
};

export type ColoplastSalesRow = {
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

export type ColoplastTrendRow = {
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

export const COLOPLAST_GROUP2_ORDER = [
  "STOMIES",
  "COMFEEL",
  "HOSPITAL",
  "GENADYNE",
  "UNO",
];

export const COLOPLAST_CATEGORY_ORDER = [
  "KS",
  "LOIP",
  "NEF",
  "NEW",
  "EKTEL",
  "1.TRAUMA",
  "2.OSTOMIES",
  "3.CATHETERS",
  "GENADYNE",
  "UNO",
];

const OC_GROUPS = ["KS", "LOIP", "NEF", "OURAMF"];
const HOSPITAL_CATEGORIES = ["1.TRAUMA", "2.OSTOMIES", "3.CATHETERS"];

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

const COLOPLAST_CATEGORIES: ColoplastCategory[] = [
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    filters: [
      `FILTER('U OC', 'U OC'[OC GROUP] IN {${quoteDaxStrings(OC_GROUPS)}})`,
    ],
    group1Expression: `IF('U OC'[OC GROUP] = "OURAMF", "KS", 'U OC'[OC GROUP])`,
    group2: "STOMIES",
    groupByColumns: ["'U OC'[OC GROUP]"],
    key: "oc",
    label: "OC",
    reportCode: "P01V06",
    reportDesc: "Oncology ",
    rowFilterTarget: "[OC PER TARGET]",
    sales2025Value: "[OC PER]",
    sales2026Target: "ROUND([OC PER TARGET], 0)",
    sales2026Value: "[OC PER]",
    summarizeSellerCodeOnly: true,
    trendValue: "ROUND([OC PER FORECAST], 0)",
    useCalendarYearFilter: true,
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "NEW",
    group2: "COMFEEL",
    key: "wc-comfeel",
    label: "WC COMFEEL",
    previousTargetKey: "coloplast_sales_current_year",
    reportCode: "P01V01",
    reportDesc: "COMFEEL ",
    rowFilterTarget: "[NEW Total PER Target]",
    sales2025Value: "[WC NEW PER]",
    sales2026Target: "ROUND([NEW Total PER Target], 0)",
    sales2026Value: "[WC NEW PER]",
    summarizeSellerCodeOnly: true,
    trendTargetKey: "coloplast_sales_2023",
    trendValue: "ROUND([NEW Total PER Forecast], 0)",
    useCalendarYearFilter: true,
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "EKTEL",
    group2: "COMFEEL",
    key: "wc-comfeel-ektel",
    label: "WC COMFEEL EKTELESEIS",
    reportCode: "P1V2",
    reportDesc: "COMFEEL ",
    rowFilterTarget: "[ACTUAL TARGET]",
    sales2025Value: "[WC EKTEL]",
    sales2026Target: "ROUND([ACTUAL TARGET], 0)",
    sales2026Value: "[WC EKTEL]",
    summarizeSellerCodeOnly: true,
    trendValue: "ROUND([EKTEL Total PER Forecast], 0)",
    useCalendarYearFilter: true,
  },
  {
    businessUnit: "COLOPLAST",
    currency: 1,
    filters: [
      `TREATAS({${quoteDaxStrings(HOSPITAL_CATEGORIES)}}, 'U HOSPITAL SUBS'[Κατηγορία])`,
    ],
    group1Expression: "'U HOSPITAL SUBS'[Κατηγορία]",
    group2: "HOSPITAL",
    groupByColumns: ["'U HOSPITAL SUBS'[Κατηγορία]"],
    key: "hospitals",
    label: "Hospitals",
    reportCode: "P01V03",
    reportDesc: "Hospital ",
    rowFilterTarget: "[HOSPITAL TARGET]",
    sales2025Value: "[HOSPITAL SALES]",
    sales2026Target: "ROUND([HOSPITAL TARGET], 0)",
    sales2026Value: "[HOSPITAL SALES]",
    summarizeSellerCodeOnly: true,
    trendValue: "ROUND([Hospital Forecast], 0)",
    useCalendarYearFilter: true,
  },
  {
    businessUnit: "GENADYNE",
    currency: 1,
    group1: "GENADYNE",
    group2: "GENADYNE",
    key: "genadyne",
    label: "GENADYNE",
    reportCode: "P01V04",
    reportDesc: "GENADYNE ",
    rowFilterTarget: "[GENADYNE TARGET SALES]",
    sales2025Value: "[GENADYNE TARGET SALES]",
    sales2026Target: "ROUND([GENADYNE TARGET SALES], 0)",
    sales2026Value: "[GENADYNE TARGET SALES]",
    summarizeSellerCodeOnly: true,
    trendValue: "ROUND([GENADYNE Forecast], 0)",
    useCalendarYearFilter: true,
  },
  {
    businessUnit: "GENADYNE",
    currency: 1,
    group1: "UNO",
    group2: "UNO",
    key: "uno",
    label: "UNO",
    reportCode: "P01V05",
    reportDesc: "UNO ",
    rowFilterTarget: "[UNO Target Sales]",
    sales2025Value: "[UNO Sales]",
    sales2026Target: "ROUND([UNO Target Sales], 0)",
    sales2026Value: "[UNO Sales]",
    summarizeSellerCodeOnly: true,
    trendValue: "ROUND([UNO Forecast], 0)",
    useCalendarYearFilter: true,
  },
];

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function readString(row: Record<string, unknown>, key: string): string {
  return String(row[`[${key}]`] ?? row[key] ?? "").trim();
}

function readNumber(row: Record<string, unknown>, key: string): number | null {
  return toNullableNumber(row[`[${key}]`] ?? row[key]);
}

function buildCalendarYearFilter(yearExpression: string): string {
  return `FILTER('Calendar', 'Calendar'[Year] = ${yearExpression})`;
}

function buildBaseArgs(
  areaName: string,
  category: ColoplastCategory,
  options: {
    calendarYear?: "last" | "current";
    includeClosedMonthStatus?: boolean;
    includeMonth?: boolean;
  },
) {
  const args = category.summarizeSellerCodeOnly
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
    `FILTER('U Sales Person', 'U Sales Person'[Area] = "${escapeDaxString(
      areaName,
    )}")`,
    `FILTER('UBussiness', 'UBussiness'[BusinessUnit] = "${category.businessUnit}")`,
  );

  if (category.filters?.length) {
    args.push(...category.filters);
  }

  if (category.useCalendarYearFilter && options.calendarYear === "last") {
    args.push(buildCalendarYearFilter("YEAR(TODAY()) - 1"));
  }

  if (category.useCalendarYearFilter && options.calendarYear === "current") {
    args.push(buildCalendarYearFilter("YEAR(TODAY())"));
  }

  if (category.group1) {
    args.push(`"Group1", "${escapeDaxString(category.group1)}"`);
  }

  args.push(`"Group2", "${escapeDaxString(category.group2)}"`);

  return args;
}

function getGroup1SelectExpression(category: ColoplastCategory) {
  return category.group1Expression ?? "[Group1]";
}

function getSalesOrderBy(category: ColoplastCategory): string {
  if (category.summarizeSellerCodeOnly) {
    return "ORDER BY [SellerCode], [Month]";
  }

  return "ORDER BY [SellerCode], [Group1], [Group2], [Month]";
}

function getTrendOrderBy(category: ColoplastCategory): string {
  if (category.summarizeSellerCodeOnly) {
    return "ORDER BY [SellerCode]";
  }

  return "ORDER BY [SellerCode], [Group1], [Group2]";
}

function buildColoplastSalesCurrentYearQuery(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, {
      calendarYear: "current",
      includeClosedMonthStatus: true,
      includeMonth: true,
    }),
    `"REPORT_CODE", "${category.reportCode}-VCYTCY"`,
    `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
    `"VCY", ${category.sales2026Value}`,
    `"TCY", ${category.sales2026Target}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(category);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    `  "Group1", ${group1},`,
    '  "Group2", [Group2],',
    "  \"Month\", 'U Months'[Month],",
    "  \"ClosedMonthStatus\", 'U Months'[Status of Closed Month],",
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    getSalesOrderBy(category),
  ]);
}

function buildColoplastSalesLastYearQuery(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, {
      calendarYear: "last",
      includeMonth: true,
    }),
    `"REPORT_CODE", "${category.reportCode}-VLY"`,
    `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
    `"VLY", ${category.sales2025Value}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(category);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    `  "Group1", ${group1},`,
    '  "Group2", [Group2],',
    "  \"Month\", 'U Months'[Month],",
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VLY", [VLY]',
    ")",
    getSalesOrderBy(category),
  ]);
}

function buildColoplastTrendCurrentYearQuery(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, { calendarYear: "current" }),
    `"REPORT_CODE", "${category.reportCode}-VTREND"`,
    `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
    `"VTREND", ${category.trendValue}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(category);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    `  ${indentDaxArgs(args)}`,
    ")",
    "VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    `  "Group1", ${group1},`,
    '  "Group2", [Group2],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VTrend", [VTREND]',
    ")",
    getTrendOrderBy(category),
  ]);
}

export function buildColoplastSalesCurrentYearQueries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastSalesCurrentYearQuery(areaName, category),
    targetKey: "coloplast_sales_current_year",
  }));
}

export function buildColoplastSalesLastYearQueries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastSalesLastYearQuery(areaName, category),
    targetKey: category.previousTargetKey ?? "coloplast_sales_last_year",
  }));
}

export function buildColoplastTrendCurrentYearQueries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastTrendCurrentYearQuery(areaName, category),
    targetKey: category.trendTargetKey ?? "coloplast_trend_current_year",
  }));
}

export function normalizeColoplastSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizeColoplastSalesCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizeColoplastTrendCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
