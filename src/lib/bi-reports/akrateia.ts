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

type AkrateiaCategory = {
  businessUnit: "COLOPLAST" | "PORGES";
  currency: 0 | 1;
  group1: string;
  groupByColumn?: string;
  reportCode: string;
  reportDesc: string;
  rowFilterTarget: string;
  sales2025Value: string;
  sales2026Target: string;
  sales2026Value: string;
  trendValue: string;
  typeFilter?: string;
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

export const AKRATEIA_CATEGORY_ORDER = [
  "IC",
  "NEW PERISTEEN",
  "CC",
  "CC SALES",
  "FOLEY",
];

const AKRATEIA_CATEGORIES: AkrateiaCategory[] = [
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "IC",
    groupByColumn: "'U IC'[IC_TYPE]",
    reportCode: "P02V01",
    reportDesc: "IC ",
    rowFilterTarget: "[IC PER TARGET]",
    sales2025Value: "[IC PER]",
    sales2026Target: "ROUND([IC PER TARGET], 0)",
    sales2026Value: "[IC PER]",
    trendValue: "ROUND([IC PER FORECAST], 0)",
    typeFilter:
      'FILTER(\'U IC\', \'U IC\'[IC_TYPE] IN {"IC", "IS-RESTART", "ICST"})',
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "NEW PERISTEEN",
    reportCode: "P02V02",
    reportDesc: "NEW PERISTEEN ",
    rowFilterTarget: "[PC PER TARGET]",
    sales2025Value: "[PC PER]",
    sales2026Target: "ROUND([PC PER TARGET], 0)",
    sales2026Value: "[PC PER]",
    trendValue: "ROUND([PC PER FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 0,
    group1: "CC",
    reportCode: "P02V03",
    reportDesc: "CC ",
    rowFilterTarget: "[CC EKTEL TARGET]",
    sales2025Value: "[CC EKTEL]",
    sales2026Target: "ROUND([CC EKTEL TARGET], 0)",
    sales2026Value: "[CC EKTEL]",
    trendValue: "ROUND([CC EKTEL FORECAST], 0)",
  },
  {
    businessUnit: "COLOPLAST",
    currency: 1,
    group1: "CC SALES",
    reportCode: "P02V04",
    reportDesc: "CC SALES ",
    rowFilterTarget: "[CC SALES TARGET]",
    sales2025Value: "[CC SALES]",
    sales2026Target: "ROUND([CC SALES TARGET], 0)",
    sales2026Value: "[CC SALES]",
    trendValue: "ROUND([CC SALES FORECAST], 0)",
  },
  {
    businessUnit: "PORGES",
    currency: 1,
    group1: "FOLEY",
    reportCode: "P02V05",
    reportDesc: "FOLEY ",
    rowFilterTarget: "[monimoi sales Target]",
    sales2025Value: "[monimoi Sales]",
    sales2026Target: "[monimoi sales Target]",
    sales2026Value: "[monimoi Sales]",
    trendValue: "[Monimoi Sales Forecast]",
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
  category: AkrateiaCategory,
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

  if (category.groupByColumn) {
    args.push(category.groupByColumn);
  }

  args.push(
    `FILTER('U Sales Person', 'U Sales Person'[Area] = "${escapeDaxString(
      areaName,
    )}")`,
    `FILTER('UBussiness', 'UBussiness'[BusinessUnit] = "${category.businessUnit}")`,
  );

  if (category.typeFilter) {
    args.push(category.typeFilter);
  }

  args.push(
    `"Group1", "${escapeDaxString(category.group1)}"`,
    '"Group2", "ALL"',
  );

  return args;
}

export function buildAkrateiaSalesCurrentYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) => {
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

    return joinDaxQuery([
      "DEFINE",
      "VAR __Base = SUMMARIZECOLUMNS(",
      `  ${indentDaxArgs(args)}`,
      ")",
      "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
      "EVALUATE",
      "SELECTCOLUMNS(",
      "  __Filtered,",
      '  "SellerCode", \'U Sales Person\'[SellerCode],',
      '  "Group1", [Group1],',
      '  "Group2", [Group2],',
      '  "Month", \'U Months\'[Month],',
      '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
      '  "REPORT_CODE", [REPORT_CODE],',
      '  "REPORT_DESC", [REPORT_DESC],',
      '  "Currency", [CURRENCY],',
      '  "VCY", [VCY],',
      '  "TCY", [TCY]',
      ")",
      "ORDER BY [SellerCode], [Group1], [Group2], [Month]",
    ]);
  });
}

export function buildAkrateiaSalesLastYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) => {
    const args = [
      ...buildBaseArgs(areaName, category, { includeMonth: true }),
      `"REPORT_CODE", "${category.reportCode}-VLY"`,
      `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
      `"VLY", ${category.sales2025Value}`,
      `"TargetFilter", ${category.rowFilterTarget}`,
      `"CURRENCY", ${category.currency}`,
    ];

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
      '  "Group1", [Group1],',
      '  "Group2", [Group2],',
      '  "Month", \'U Months\'[Month],',
      '  "REPORT_CODE", [REPORT_CODE],',
      '  "REPORT_DESC", [REPORT_DESC],',
      '  "Currency", [CURRENCY],',
      '  "VLY", [VLY]',
      ")",
      "ORDER BY [SellerCode], [Group1], [Group2], [Month]",
    ]);
  });
}

export function buildAkrateiaTrendCurrentYearQueries(areaName: string): string[] {
  return AKRATEIA_CATEGORIES.map((category) => {
    const args = [
      ...buildBaseArgs(areaName, category, {}),
      `"REPORT_CODE", "${category.reportCode}-VTREND"`,
      `"REPORT_DESC", "${escapeDaxString(category.reportDesc)}"`,
      `"VTREND", ${category.trendValue}`,
      `"TargetFilter", ${category.rowFilterTarget}`,
      `"CURRENCY", ${category.currency}`,
    ];

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
      '  "Group1", [Group1],',
      '  "Group2", [Group2],',
      '  "REPORT_CODE", [REPORT_CODE],',
      '  "REPORT_DESC", [REPORT_DESC],',
      '  "Currency", [CURRENCY],',
      '  "VTrend", [VTREND]',
      ")",
      "ORDER BY [SellerCode], [Group1], [Group2]",
    ]);
  });
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
