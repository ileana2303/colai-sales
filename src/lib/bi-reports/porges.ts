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
  joinDaxQuery,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";

export type PorgesSalesRow = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  group1: string;
  group2: string;
  group3?: string;
  month: string;
  closedMonthStatus: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vcy: number | null;
  tcy: number | null;
};

export type PorgesTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  group1: string;
  group2: string;
  group3?: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vTrend: number | null;
};

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

function readOptionalString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = readString(row, key);
  return value || undefined;
}

export function buildPorgesSalesLastYearQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    "  'U Months'[Month],",
    "  'UBussiness'[BusinessUnit],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    "  FILTER(ALL('U Sales Person'), [SALES TARGET PORGES] > 0),",
    '  "REPORT_CODE", "P05VALL-VLY",',
    '  "REPORT_DESC", "Porges Sales by Sales Person and Group LY",',
    '  "Currency", 1,',
    '  "VCY", [Sales]',
    ")",
    'VAR __Filtered = FILTER(__Base, [VCY] > 0 && \'UBussiness\'[BusinessUnit] = "Porges")',
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "Group3", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VLY", [VCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Group3], [Month]",
  ]);
}

function buildPorgesSalesCurrentYearBaseQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    '  "REPORT_CODE", "P05VALL-VCYTCY",',
    '  "REPORT_DESC", "Porges Sales, Target and Trend by Sales Person and Group",',
    '  "Currency", 1,',
    '  "VCY", [Sales],',
    '  "TCY", [SALES TARGET PORGES]',
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0)",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "Group3", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Group3], [Month]",
  ]);
}

export function buildPorgesSalesQuery(areaName: string): string {
  return buildPorgesSalesCurrentYearBaseQuery(areaName);
}

export function buildPorgesSalesTargetsTrendsQuery(areaName: string): string {
  return buildPorgesSalesCurrentYearBaseQuery(areaName);
}

export function buildPorgesTrendQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    '  "REPORT_CODE", "P05VALL-VTREND",',
    '  "REPORT_DESC", "Porges Sales, Target and Trend by Sales Person and Group",',
    '  "Currency", 1,',
    '  "TCY", [SALES TARGET PORGES],',
    '  "VTrend", [Sales Trend]',
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0)",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "Group3", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VTrend", [VTrend]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Group3]",
  ]);
}

export function normalizePorgesSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizePorgesSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizePorgesTrendRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
