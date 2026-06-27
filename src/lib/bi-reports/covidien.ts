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

const COVIDIEN_BUSINESS_UNIT = "COVIDIEN";
const COVIDIEN_FAMILY_GROUPS = [
  "1.STAPLING",
  "2.LAPAROSCOPY",
  "3.EBD",
  "4.MESH",
  "5.SUTURES",
  "6.SONI 7",
];
const COVIDIEN_EXCLUDED_DOCUMENT_TYPES = [
  "ΔΕΑΝ - Δελτίο Ποσοτικής Παραλαβής",
  "ΔΧΓ - Δελτίο Αποστολής",
  "ΔΧΔ - Δελτίο Αποστολής (χωρίς αξία)",
];

export type CovidienSalesRow = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  group1: string;
  group2: string;
  month: string;
  closedMonthStatus: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vcy: number | null;
  vlc?: number | null;
  tcy: number | null;
};

export type CovidienTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  group1: string;
  group2: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vTrend: number | null;
};

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

function getCovidienQueryConstants() {
  return {
    businessUnit: escapeDaxString(COVIDIEN_BUSINESS_UNIT),
    excludedDocumentTypes: quoteDaxStrings(COVIDIEN_EXCLUDED_DOCUMENT_TYPES),
    familyGroups: quoteDaxStrings(COVIDIEN_FAMILY_GROUPS),
  };
}

function getCovidienSalesQueryContext(areaName: string) {
  return {
    area: escapeDaxString(areaName),
    ...getCovidienQueryConstants(),
  };
}

export function buildCovidienSalesLastYearQuery(areaName: string): string {
  const { area, businessUnit, excludedDocumentTypes, familyGroups } =
    getCovidienSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Family'[Family Group],",
    "  'U Months'[Month],",
    `  FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}),`,
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  ${buildCalendarYearFilter(LAST_CALENDAR_YEAR_DAX)},`,
    '  "REPORT_CODE", "P07VALL-VLY",',
    '  "REPORT_DESC", "Covidien Sales and Target by AREA, GROUP and Business Unit LY",',
    '  "Currency", 1,',
    `  "VLY", CALCULATE([Sales PROCON], ASP_EBS_SALES[BusinessUnit] = "${businessUnit}", NOT(ASP_EBS_SALES[DocumentType] IN {${excludedDocumentTypes}}))`,
    ")",
    "VAR __Filtered = FILTER(__Base, [VLY] > 0)",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"Area\", 'U Sales Person'[Area],",
    "  \"Team\", 'U Sales Person'[Team],",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    "  \"SellerName\", 'U Sales Person'[Πωλητής],",
    "  \"Group1\", 'U Family'[Family Group],",
    '  "Group2", "COVIDIEN",',
    "  \"Month\", 'U Months'[Month],",
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VLY", [VLY]',
    ")",
    "ORDER BY [Area], [Team], [SellerName], [Group1], [Month]",
  ]);
}

export function buildCovidienSalesQuery(areaName: string): string {
  const { area, businessUnit, excludedDocumentTypes, familyGroups } =
    getCovidienSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[SellerCode],",
    "  'U Family'[Family Group],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}),`,
    `  ${buildCalendarYearFilter(CURRENT_CALENDAR_YEAR_DAX)},`,
    '  "REPORT_CODE", "P07VALL-VCYTRCY",',
    '  "REPORT_DESC", "Covidien Sales and Target by AREA, GROUP and Business Unit",',
    '  "Currency", 1,',
    `  "VCY", CALCULATE([Sales PROCON], ASP_EBS_SALES[BusinessUnit] = "${businessUnit}", NOT(ASP_EBS_SALES[DocumentType] IN {${excludedDocumentTypes}})),`,
    '  "TCY", [Covidien Sales Target]',
    ")",
    "VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY])) || NOT(ISBLANK([TCY])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    "  \"Group1\", 'U Family'[Family Group],",
    '  "Group2", "COVIDIEN",',
    "  \"Month\", 'U Months'[Month],",
    "  \"ClosedMonthStatus\", 'U Months'[Status of Closed Month],",
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    "ORDER BY [SellerCode], [Group1], [Month]",
  ]);
}

export function buildCovidienTrendQuery(areaName: string): string {
  const { area, familyGroups } = getCovidienSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Family'[Family Group],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    `  FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}),`,
    '  "REPORT_CODE", "P07VALL-VTREND",',
    '  "REPORT_DESC", "Covidien Sales Trend by AREA and by GROUP",',
    '  "Currency", 1,',
    '  "VTrend", [Covidien Sales Trend]',
    ")",
    "VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VTrend])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    "  \"Area\", 'U Sales Person'[Area],",
    "  \"Team\", 'U Sales Person'[Team],",
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    "  \"Group1\", 'U Family'[Family Group],",
    '  "Group2", "COVIDIEN",',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VTrend", [VTrend]',
    ")",
    "ORDER BY [Area], [Team], [SellerCode], [Group1], [Group2]",
  ]);
}

export function normalizeCovidienSalesLastYearRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  return normalizeLastYearSalesRows(response);
}

export function normalizeCovidienSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  return normalizeCurrentYearSalesRows(response);
}

export function normalizeCovidienTrendRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  return normalizeTrendSalesRows(response);
}
