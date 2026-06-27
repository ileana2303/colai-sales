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

export function buildAmoenaSalesCurrentYearQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    "  FILTER('Calendar', 'Calendar'[Year] = 2026),",
    '  "Group2", "AMOENA",',
    '  "REPORT_CODE", "P03V01-VCYTCY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VCY", [SALES],',
    '  "TCY", ROUND([SALES TARGET AMOENA], 0),',
    '  "CURRENCY", 1',
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
    '  "VCY", [VCY],',
    '  "TCY", [TCY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Month]",
  ]);
}

export function buildAmoenaSalesLastYearQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Months'[Month],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    "  FILTER('Calendar', 'Calendar'[Year] = YEAR(TODAY()) - 1),",
    '  "Group2", "AMOENA",',
    '  "REPORT_CODE", "P03V01-VLY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VLY", [SALES],',
    '  "TargetFilter", [SALES TARGET AMOENA],',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VLY", [VLY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Month]",
  ]);
}

export function buildAmoenaTrendQuery(areaName: string): string {
  const area = escapeDaxString(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  FILTER('UBussiness', 'UBussiness'[BusinessUnit] = \"AMOENA\"),",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    "  FILTER('Calendar', 'Calendar'[Year] = 2026),",
    '  "Group2", "AMOENA",',
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
    '  "VTREND", [VTREND],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode]",
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
