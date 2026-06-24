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
  joinDaxQuery,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";

export function buildAmoenaSalesCurrentYearQuery(_areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    '  "Group2", "ALL",',
    '  "REPORT_CODE", "P03V01-VCYTCY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "Currency", 1,',
    '  "VCY", [SALES],',
    '  "TCY", [SALES TARGET AMOENA]',
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Month]",
  ]);
}

export function buildAmoenaSalesLastYearQuery(_areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  'U Months'[Month],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    "  FILTER('Calendar', 'Calendar'[Year] = 2025),",
    '  "Group2", "ALL",',
    '  "REPORT_CODE", "P03V01-VLY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "Currency", 1,',
    '  "VLY", [SALES]',
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VLY", [VLY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Month]",
  ]);
}

export function buildAmoenaTrendQuery(_areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    '  "Group2", "ALL",',
    '  "REPORT_CODE", "P03V01-VTREND",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VTREND", [SALES],',
    '  "TargetFilter", [SALES TARGET AMOENA],',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [CURRENCY],',
    '  "VTrend", [VTREND]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2]",
  ]);
}

export function normalizeAmoenaSalesCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizeAmoenaSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizeAmoenaTrendRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
