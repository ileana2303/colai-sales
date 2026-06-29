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

export const AMOENA_SALES_CATEGORY_ORDER = [
  "ΤΖΙΡΟΣ ΧΟΝΔΡΙΚΗΣ",
  "ΝΟΣΟΚΟΜΕΙΑΚΟΣ",
  "ΤΖΙΡΟΣ ΛΙΑΝΙΚΗΣ",
  "ΤΖΙΡΟΣ ΝΕΩΝ",
];

export const AMOENA_PERISTATIKA_CATEGORY_ORDER = [
  "ΝΕΑ ΠΕΡΙΣΤΑΤΙΚΑ",
  "Μ.Ο. ΝΕΩΝ",
];

function amoenaAreaFilter(areaName: string) {
  const area = escapeDaxString(areaName);

  return [
    '  FILTER(\'UBussiness\', \'UBussiness\'[BusinessUnit] = "AMOENA"),',
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
  ];
}

const AMOENA_GROUP3_DAX =
  'IF(\'U Trade Family AMOENA\'[Trader Family AMOENA] = "Individuals", \'Ua1\'[UNR], "ALL")';

function buildAmoenaSalesCurrentYearSalesQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  'Ua1'[UNR],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "SALES",',
    '  "REPORT_CODE", "P03V01-VCYTCY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VCY", [Sales],',
    '  "TCY", ROUND([Sales Target Amoena], 0),',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    `  "Group3", ${AMOENA_GROUP3_DAX},`,
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group3], [Month]",
  ]);
}

function buildAmoenaSalesCurrentYearPeristatikaQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'Ua1'[UNR],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "ΠΕΡΙΣΤΑΤΙΚΑ",',
    '  "REPORT_CODE", "P03V02-VCYTCY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VCY", [% Cover PER Amoena],',
    '  "TCY", ROUND([PER Target Amoena], 0),',
    '  "CURRENCY", 0',
    ")",
    "VAR __Filtered = FILTER(__Base, [TCY] > 0 && NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'Ua1\'[UNR],',
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Month]",
  ]);
}

function buildAmoenaSalesLastYearSalesQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  'Ua1'[UNR],",
    "  'U Months'[Month],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "SALES",',
    '  "REPORT_CODE", "P03V01-VLY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VLY", [Sales],',
    '  "TargetFilter", [Sales Target Amoena],',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    `  "Group3", ${AMOENA_GROUP3_DAX},`,
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VLY", [VLY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group3], [Month]",
  ]);
}

function buildAmoenaSalesLastYearPeristatikaQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'Ua1'[UNR],",
    "  'U Months'[Month],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "ΠΕΡΙΣΤΑΤΙΚΑ",',
    '  "REPORT_CODE", "P03V02-VLY",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VLY", [% Cover PER Amoena],',
    '  "TargetFilter", [PER Target Amoena],',
    '  "CURRENCY", 0',
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0 && NOT(ISBLANK([VLY])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'Ua1\'[UNR],',
    '  "Group2", [Group2],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VLY", [VLY],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Month]",
  ]);
}

function buildAmoenaTrendSalesQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Trade Family AMOENA'[Trader Family AMOENA],",
    "  'Ua1'[UNR],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "SALES",',
    '  "REPORT_CODE", "P03V01-VTREND",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VTREND", ROUND([Sales Trend], 0),',
    '  "TargetFilter", [Sales Target Amoena],',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Trade Family AMOENA\'[Trader Family AMOENA],',
    '  "Group2", [Group2],',
    `  "Group3", ${AMOENA_GROUP3_DAX},`,
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VTREND", [VTREND],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group3]",
  ]);
}

function buildAmoenaTrendPeristatikaQuery(areaName: string): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'Ua1'[UNR],",
    ...amoenaAreaFilter(areaName),
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "Group2", "ΠΕΡΙΣΤΑΤΙΚΑ",',
    '  "REPORT_CODE", "P03V02-VTREND",',
    '  "REPORT_DESC", "AMOENA ",',
    '  "VTREND", ROUND([% Cover PER Amoena], 0),',
    '  "TargetFilter", [PER Target Amoena],',
    '  "CURRENCY", 0',
    ")",
    "VAR __Filtered = FILTER(__Base, [VTREND] > 0 && NOT(ISBLANK([VTREND])) && [TargetFilter] > 1 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'Ua1\'[UNR],',
    '  "Group2", [Group2],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VTREND", [VTREND],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [SellerCode], [Group1]",
  ]);
}

export function buildAmoenaSalesCurrentYearQuery(areaName: string): string {
  return buildAmoenaSalesCurrentYearSalesQuery(areaName);
}

export function buildAmoenaSalesNoCurrencyCurrentYearQuery(
  areaName: string,
): string {
  return buildAmoenaSalesCurrentYearPeristatikaQuery(areaName);
}

export function buildAmoenaSalesLastYearQuery(areaName: string): string {
  return buildAmoenaSalesLastYearSalesQuery(areaName);
}

export function buildAmoenaSalesNoCurrencyLastYearQuery(
  areaName: string,
): string {
  return buildAmoenaSalesLastYearPeristatikaQuery(areaName);
}

export function buildAmoenaTrendCurrentYearQuery(areaName: string): string {
  return buildAmoenaTrendSalesQuery(areaName);
}

export function buildAmoenaTrendNoCurrencyCurrentYearQuery(
  areaName: string,
): string {
  return buildAmoenaTrendPeristatikaQuery(areaName);
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
