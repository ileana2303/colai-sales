import {
  escapeDaxString,
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

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

function readString(row: Record<string, unknown>, key: string): string {
  return String(row[`[${key}]`] ?? row[key] ?? "").trim();
}

function readNumber(row: Record<string, unknown>, key: string): number | null {
  return toNullableNumber(row[`[${key}]`] ?? row[key]);
}

function getCovidienSalesQueryContext(areaName: string) {
  const area = escapeDaxString(areaName);
  const businessUnit = escapeDaxString(COVIDIEN_BUSINESS_UNIT);
  const excludedDocumentTypes = quoteDaxStrings(
    COVIDIEN_EXCLUDED_DOCUMENT_TYPES,
  );
  const familyGroups = quoteDaxStrings(COVIDIEN_FAMILY_GROUPS);

  return { area, businessUnit, excludedDocumentTypes, familyGroups };
}

export function buildCovidienSales2025Query(areaName: string): string {
  const { area, businessUnit, excludedDocumentTypes, familyGroups } =
    getCovidienSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'U Family'[Family Group], 'U Months'[Month], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}), "REPORT_CODE", "P07VALL-VLY", "REPORT_DESC", "Covidien Sales and Target by AREA, GROUP and Business Unit LY", "Currency", 1, "VCY", CALCULATE([Sales PROCON], ASP_EBS_SALES[BusinessUnit] = "${businessUnit}", NOT(ASP_EBS_SALES[DocumentType] IN {${excludedDocumentTypes}}))) VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", 'U Family'[Family Group], "Group2", "COVIDIEN", "Month", 'U Months'[Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "Currency", [Currency], "VLY", [VCY]) ORDER BY [Area], [Team], [SellerName], [Group1], [Month]`;
}

export function buildCovidienSalesQuery(areaName: string): string {
  const { area, businessUnit, excludedDocumentTypes, familyGroups } =
    getCovidienSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'U Family'[Family Group], 'U Months'[Month], 'U Months'[Status of Closed Month], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}), "REPORT_CODE", "P07VALL-VCYTRCY", "REPORT_DESC", "Covidien Sales and Target by AREA, GROUP and Business Unit", "Currency", 1, "VCY", CALCULATE([Sales PROCON], ASP_EBS_SALES[BusinessUnit] = "${businessUnit}", NOT(ASP_EBS_SALES[DocumentType] IN {${excludedDocumentTypes}})), "TCY", [Covidien Sales Target]) VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY])) || NOT(ISBLANK([TCY]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", 'U Family'[Family Group], "Group2", "COVIDIEN", "Month", 'U Months'[Month], "ClosedMonthStatus", 'U Months'[Status of Closed Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "Currency", [Currency], "VCY", [VCY], "TCY", [TCY]) ORDER BY [Area], [Team], [SellerName], [Group1], [Month]`;
}

export function buildCovidienTrendQuery(areaName: string): string {
  const { area, familyGroups } = getCovidienSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Family'[Family Group], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}), "REPORT_CODE", "P07VALL-VTREND", "REPORT_DESC", "Covidien Sales Trend by AREA and by GROUP", "Currency", 1, "VTrend", [Covidien Sales Trend]) VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VTrend]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "Group1", 'U Family'[Family Group], "Group2", "COVIDIEN", "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "Currency", [Currency], "VTrend", [VTrend]) ORDER BY [Area], [Team], [SellerCode], [Group1], [Group2]`;
}

export function normalizeCovidienSales2025Rows(
  response: PowerBiExecuteQueriesResponse,
): CovidienSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    sellerName: readString(row, "SellerName"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    month: readString(row, "Month"),
    closedMonthStatus: "",
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    currency: readNumber(row, "Currency"),
    vcy: readNumber(row, "VLY") ?? readNumber(row, "VCY"),
    tcy: null,
  }));
}

export function normalizeCovidienSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CovidienSalesRow[] {
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
    currency: readNumber(row, "Currency"),
    vcy: readNumber(row, "VCY"),
    tcy: readNumber(row, "TCY"),
  }));
}

export function normalizeCovidienTrendRows(
  response: PowerBiExecuteQueriesResponse,
): CovidienTrendRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    currency: readNumber(row, "Currency"),
    vTrend: readNumber(row, "VTrend"),
  }));
}
