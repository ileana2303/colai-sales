import type { BiReportPowerBiTargetKey } from "@/lib/bi-reports/biReports";
import {
  escapeDaxString,
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

export const COLOPLAST_CATEGORY_ORDER = [
  "KS",
  "LOIP",
  "NEF",
  "COMFEEL",
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
    group2: "ALL",
    groupByColumns: ["'U OC'[OC GROUP]"],
    key: "oc",
    label: "OC",
    reportCode: "P01V06",
    reportDesc: "Oncology ",
    rowFilterTarget: "[OC PER TARGET]",
    sales2025Value: "[OC PER]",
    sales2026Target: "ROUND([OC PER TARGET], 0)",
    sales2026Value: "[OC PER]",
    trendValue: "ROUND([OC PER FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "COMFEEL",
    group2: "NEW",
    key: "wc-comfeel",
    label: "WC COMFEEL",
    previousTargetKey: "coloplast_sales_2026",
    reportCode: "P01V01",
    reportDesc: "COMFEEL ",
    rowFilterTarget: "[NEW Total PER Target]",
    sales2025Value: "[WC NEW PER]",
    sales2026Target: "ROUND([NEW Total PER Target], 0)",
    sales2026Value: "[WC NEW PER]",
    trendTargetKey: "coloplast_sales_2023",
    trendValue: "ROUND([NEW Total PER Forecast], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "COMFEEL",
    group2: "EKTEL",
    key: "wc-comfeel-ektel",
    label: "WC COMFEEL EKTELESEIS",
    reportCode: "P1V2",
    reportDesc: "COMFEEL ",
    rowFilterTarget: "[ACTUAL TARGET]",
    sales2025Value: "[WC EKTEL]",
    sales2026Target: "ROUND([ACTUAL TARGET], 0)",
    sales2026Value: "[WC EKTEL]",
    trendValue: "ROUND([EKTEL Total PER Forecast], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 1,
    filters: [
      `TREATAS({${quoteDaxStrings(HOSPITAL_CATEGORIES)}}, 'U HOSPITAL SUBS'[Κατηγορία])`,
    ],
    group1Expression: "'U HOSPITAL SUBS'[Κατηγορία]",
    group2: "ALL",
    groupByColumns: ["'U HOSPITAL SUBS'[Κατηγορία]"],
    key: "hospitals",
    label: "Hospitals",
    reportCode: "P01V03",
    reportDesc: "Hospital ",
    rowFilterTarget: "[HOSPITAL TARGET]",
    sales2025Value: "[HOSPITAL SALES]",
    sales2026Target: "ROUND([HOSPITAL TARGET], 0)",
    sales2026Value: "[HOSPITAL SALES]",
    trendValue: "ROUND([Hospital Forecast], 0)",
  },
  {
    businessUnit: "GENADYNE",
    currency: 1,
    group1: "GENADYNE",
    group2: "ALL",
    key: "genadyne",
    label: "GENADYNE",
    reportCode: "P01V04",
    reportDesc: "GENADYNE ",
    rowFilterTarget: "[GENADYNE TARGET SALES]",
    sales2025Value: "[GENADYNE TARGET SALES]",
    sales2026Target: "ROUND([GENADYNE TARGET SALES], 0)",
    sales2026Value: "[GENADYNE TARGET SALES]",
    trendValue: "ROUND([GENADYNE Forecast], 0)",
  },
  {
    businessUnit: "GENADYNE",
    currency: 1,
    group1: "UNO",
    group2: "ALL",
    key: "uno",
    label: "UNO",
    reportCode: "P01V05",
    reportDesc: "UNO ",
    rowFilterTarget: "[UNO Target Sales]",
    sales2025Value: "[UNO Sales]",
    sales2026Target: "ROUND([UNO Target Sales], 0)",
    sales2026Value: "[UNO Sales]",
    trendValue: "ROUND([UNO Forecast], 0)",
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

function buildBaseArgs(
  areaName: string,
  category: ColoplastCategory,
  options: { includeClosedMonthStatus?: boolean; includeMonth?: boolean },
) {
  const args = [
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

  if (category.group1) {
    args.push(`"Group1", "${escapeDaxString(category.group1)}"`);
  }

  args.push(`"Group2", "${escapeDaxString(category.group2)}"`);

  return args;
}

function getGroup1SelectExpression(category: ColoplastCategory) {
  return category.group1Expression ?? "[Group1]";
}

function buildColoplastSales2026Query(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, {
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

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS(${args.join(
    ", ",
  )}) VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", COALESCE('U Sales Person'[Area], "ΔΕΝ ΟΡΙΖΕΤΑΙ"), "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", ${group1}, "Group2", [Group2], "Month", 'U Months'[Month], "ClosedMonthStatus", 'U Months'[Status of Closed Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "VCY", [VCY], "TCY", [TCY], "CURRENCY", [CURRENCY]) ORDER BY [Area], [Team], [SellerName], [Month]`;
}

function buildColoplastSales2025Query(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, { includeMonth: true }),
    `"REPORT_CODE", "${category.reportCode}-VLY"`,
    `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
    `"VLY", ${category.sales2025Value}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(category);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS(${args.join(
    ", ",
  )}) VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", COALESCE('U Sales Person'[Area], "ΔΕΝ ΟΡΙΖΕΤΑΙ"), "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", ${group1}, "Group2", [Group2], "Month", 'U Months'[Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "VLY", [VLY], "CURRENCY", [CURRENCY]) ORDER BY [Area], [Team], [SellerName], [Month]`;
}

function buildColoplastTrend2026Query(
  areaName: string,
  category: ColoplastCategory,
): string {
  const args = [
    ...buildBaseArgs(areaName, category, {}),
    `"REPORT_CODE", "${category.reportCode}-VTREND"`,
    `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
    `"VTREND", ${category.trendValue}`,
    `"TargetFilter", ${category.rowFilterTarget}`,
    `"CURRENCY", ${category.currency}`,
  ];
  const group1 = getGroup1SelectExpression(category);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS(${args.join(
    ", ",
  )}) VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", COALESCE('U Sales Person'[Area], "ΔΕΝ ΟΡΙΖΕΤΑΙ"), "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", ${group1}, "Group2", [Group2], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "VTREND", [VTREND], "CURRENCY", [CURRENCY]) ORDER BY [Area], [Team], [SellerName]`;
}

export function buildColoplastSales2026Queries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastSales2026Query(areaName, category),
    targetKey: "coloplast_sales_2026",
  }));
}

export function buildColoplastSales2025Queries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastSales2025Query(areaName, category),
    targetKey: category.previousTargetKey ?? "coloplast_sales_2025",
  }));
}

export function buildColoplastTrend2026Queries(
  areaName: string,
): ColoplastQuerySpec[] {
  return COLOPLAST_CATEGORIES.map((category) => ({
    label: category.label,
    query: buildColoplastTrend2026Query(areaName, category),
    targetKey: category.trendTargetKey ?? "coloplast_trend_2026",
  }));
}

export function normalizeColoplastSales2025Rows(
  response: PowerBiExecuteQueriesResponse,
): ColoplastSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => {
    const vlc =
      readNumber(row, "VLC") ??
      readNumber(row, "VLY") ??
      readNumber(row, "VCY");

    return {
      area: readString(row, "Area"),
      team: readString(row, "Team"),
      sellerCode: readString(row, "SellerCode"),
      sellerName: readString(row, "SellerName"),
      group1: readString(row, "Group1"),
      group2: readString(row, "Group2"),
      month: readString(row, "Month"),
      reportCode: readString(row, "REPORT_CODE"),
      reportDesc: readString(row, "REPORT_DESC"),
      currency: readNumber(row, "CURRENCY") ?? readNumber(row, "Currency"),
      vcy: vlc,
      vlc,
      tcy: null,
    };
  });
}

export function normalizeColoplastSales2026Rows(
  response: PowerBiExecuteQueriesResponse,
): ColoplastSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    sellerName: readString(row, "SellerName"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    month: readString(row, "Month"),
    closedMonthStatus: readString(row, "ClosedMonthStatus"),
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    currency: readNumber(row, "CURRENCY") ?? readNumber(row, "Currency"),
    vcy: readNumber(row, "VCY"),
    vlc: null,
    tcy: readNumber(row, "TCY"),
  }));
}

export function normalizeColoplastTrend2026Rows(
  response: PowerBiExecuteQueriesResponse,
): ColoplastTrendRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    sellerName: readString(row, "SellerName"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    currency: readNumber(row, "CURRENCY") ?? readNumber(row, "Currency"),
    vTrend: readNumber(row, "VTREND") ?? readNumber(row, "VTrend"),
  }));
}
