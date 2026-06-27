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

const BBM_BUSINESS_UNITS = ["BAUSCH & LOMB", "BVI", "MORIA"];

export type BbmSalesRow = {
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
  currency?: number | null;
  vcy: number | null;
  vlc?: number | null;
  tcy?: number | null;
};

export type BbmTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  group1: string;
  group2: string;
  reportCode: string;
  reportDesc: string;
  vTrend: number | null;
};

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

function getBbmSalesQueryContext(areaName: string) {
  const area = escapeDaxString(areaName);
  const businessUnits = quoteDaxStrings(BBM_BUSINESS_UNITS);

  return { area, businessUnits };
}

export function buildBbmSalesLastYearQuery(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    "  'UBussiness'[BusinessUnit],",
    "  'U Months'[Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}),`,
    `  ${buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX)},`,
    '  "REPORT_CODE", "P06VALL-VLY",',
    '  "REPORT_DESC", "BBM Sales by AREA, GROUP and Business Unit",',
    '  "VCY", [Sales LY]',
    ")",
    "VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "Group2", \'UBussiness\'[BusinessUnit],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VLY", [VCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Month]",
  ]);
}

export function buildBbmSalesCurrentYearQuery(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    "  'UBussiness'[BusinessUnit],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}),`,
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "REPORT_CODE", "P06VALL-VCYTRCY",',
    '  "REPORT_DESC", "BBM Sales and Target by AREA, GROUP and Business Unit",',
    '  "VCY", [Sales],',
    '  "TCY", [Target Triplex BBM API]',
    ")",
    "VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY])) || NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "Group2", \'UBussiness\'[BusinessUnit],',
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Group2], [Month]",
  ]);
}

export function buildBbmTrendQuery(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Item Family Code'[ItemFamilyCode (groups)],",
    "  'UBussiness'[BusinessUnit],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}),`,
    '  "REPORT_CODE", "P06VALL-VTREND",',
    '  "REPORT_DESC", "BBM Sales Trend by AREA, GROUP and Business Unit",',
    '  "VTrend", [Sales Trend],',
    '  "TargetFilter", CALCULATE([Target Triplex BBM API]),',
    '  "CURRENCY", 1',
    ")",
    "VAR __Filtered = FILTER(__Base, [VTrend] > 0 && NOT(ISBLANK([VTrend])) && [TargetFilter] > 0 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"Area\", 'U Sales Person'[Area],",
    "  \"Team\", 'U Sales Person'[Team],",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[ItemFamilyCode (groups)],',
    '  "Group2", \'UBussiness\'[BusinessUnit],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "VTrend", [VTrend],',
    '  "CURRENCY", [CURRENCY]',
    ")",
    "ORDER BY [Area], [Team], [SellerCode], [Group1], [Group2]",
  ]);
}

export function normalizeBbmSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizeBbmSalesCurrentYearRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizeBbmTrendRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
