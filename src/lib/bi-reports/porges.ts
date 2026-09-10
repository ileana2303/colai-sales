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
  joinDaxQuery,
  LAST_CALENDAR_YEAR_DAX,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";

const PORGES_SUMMARIZE_DIMENSIONS = [
  "  'U Sales Person'[SellerCode],",
  "  'U Item Family Code'[Porges Group],",
  "  'U Item Family Code'[Porges SUB],",
  "  'U Item Family Code'[ItemFamilyCode (groups)],",
] as const;

const PORGES_SELECT_GROUP_COLUMNS = [
  "  \"Group1\", 'U Item Family Code'[Porges SUB],",
  "  \"Group2\", 'U Item Family Code'[Porges Group],",
  "  \"Group3\", 'U Item Family Code'[ItemFamilyCode (groups)],",
] as const;

export function alignPorgesMatrixGroups<
  T extends { group1: string | null; group2: string | null },
>(row: T): T {
  return {
    ...row,
    group1: row.group2,
    group2: row.group1,
  };
}

function buildPorgesAreaFilter(areaName: string) {
  const area = escapeDaxString(areaName);
  return `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`;
}

export function buildPorgesSalesLastYearQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    ...PORGES_SUMMARIZE_DIMENSIONS,
    "  'U Months'[Month],",
    "  'UBussiness'[BusinessUnit],",
    "  FILTER(ALL('U Sales Person'), [SALES TARGET PORGES] > 0),",
    buildPorgesAreaFilter(areaName),
    `  ${buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX)},`,
    '  "REPORT_CODE", "P05VALL-VLY",',
    '  "REPORT_DESC", "Porges Sales by Sales Person and Group LY",',
    '  "Currency", 1,',
    '  "VCY", [Sales]',
    ")",
    `  VAR __Filtered = FILTER(__Base, [VCY] > 0 && 'UBussiness'[BusinessUnit] = "Porges")`,
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    ...PORGES_SELECT_GROUP_COLUMNS,
    "  \"Month\", 'U Months'[Month],",
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VLY", [VCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Group3], [Month]",
  ]);
}

function buildPorgesSalesCurrentYearBaseQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    ...PORGES_SUMMARIZE_DIMENSIONS,
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    buildPorgesAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
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
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    ...PORGES_SELECT_GROUP_COLUMNS,
    "  \"Month\", 'U Months'[Month],",
    "  \"ClosedMonthStatus\", 'U Months'[Status of Closed Month],",
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
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    ...PORGES_SUMMARIZE_DIMENSIONS,
    buildPorgesAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
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
    "  \"SellerCode\", 'U Sales Person'[SellerCode],",
    ...PORGES_SELECT_GROUP_COLUMNS,
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
  return normalizeLastYearSalesRows(response).map(alignPorgesMatrixGroups);
}

export function normalizePorgesSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response).map(alignPorgesMatrixGroups);
}

export function normalizePorgesTrendRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response).map(alignPorgesMatrixGroups);
}
