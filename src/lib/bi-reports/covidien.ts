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
  familyGroup: string;
  month: string;
  closedMonthStatus: string;
  salesProcon: number | null;
  covidienSalesTarget: number | null;
  proconCover: number | null;
};

export type CovidienTrendRow = {
  area: string;
  team: string;
  sellerCode: string;
  familyGroup: string;
  salesProcon: number | null;
  covidienSalesTrend: number | null;
};

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function quoteDaxStrings(values: string[]): string {
  return values.map((value) => `"${escapeDaxString(value)}"`).join(", ");
}

function getCovidienCommonFilters(areaName: string): string {
  const familyGroups = quoteDaxStrings(COVIDIEN_FAMILY_GROUPS);
  const excludedDocumentTypes = quoteDaxStrings(
    COVIDIEN_EXCLUDED_DOCUMENT_TYPES,
  );
  const area = escapeDaxString(areaName);
  const businessUnit = escapeDaxString(COVIDIEN_BUSINESS_UNIT);

  return `FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('U Family', 'U Family'[Family Group] IN {${familyGroups}}), "Sales PROCON", CALCULATE([Sales PROCON], ASP_EBS_SALES[BusinessUnit] = "${businessUnit}", NOT(ASP_EBS_SALES[DocumentType] IN {${excludedDocumentTypes}}))`;
}

export function buildCovidienSalesQuery(areaName: string): string {
  return `EVALUATE SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'U Family'[Family Group], 'U Months'[Month], 'U Months'[Status of Closed Month], ${getCovidienCommonFilters(areaName)}, "Covidien Sales Target", [Covidien Sales Target], "% PROCON Cover", [% PROCON Cover]) ORDER BY 'U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[Πωλητής], 'U Family'[Family Group], 'U Months'[Month]`;
}

export function buildCovidienTrendQuery(areaName: string): string {
  return `EVALUATE SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Family'[Family Group], ${getCovidienCommonFilters(areaName)}, "Covidien Sales Trend", [Covidien Sales Trend]) ORDER BY 'U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Family'[Family Group]`;
}

export function normalizeCovidienSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CovidienSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: String(row["U Sales Person[Area]"] ?? "").trim(),
    team: String(row["U Sales Person[Team]"] ?? "").trim(),
    sellerCode: String(row["U Sales Person[SellerCode]"] ?? "").trim(),
    sellerName: String(row["U Sales Person[Πωλητής]"] ?? "").trim(),
    familyGroup: String(row["U Family[Family Group]"] ?? "").trim(),
    month: String(row["U Months[Month]"] ?? "").trim(),
    closedMonthStatus: String(
      row["U Months[Status of Closed Month]"] ?? "",
    ).trim(),
    salesProcon: toNullableNumber(row["[Sales PROCON]"]),
    covidienSalesTarget: toNullableNumber(row["[Covidien Sales Target]"]),
    proconCover: toNullableNumber(row["[% PROCON Cover]"]),
  }));
}

export function normalizeCovidienTrendRows(
  response: PowerBiExecuteQueriesResponse,
): CovidienTrendRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: String(row["U Sales Person[Area]"] ?? "").trim(),
    team: String(row["U Sales Person[Team]"] ?? "").trim(),
    sellerCode: String(row["U Sales Person[SellerCode]"] ?? "").trim(),
    familyGroup: String(row["U Family[Family Group]"] ?? "").trim(),
    salesProcon: toNullableNumber(row["[Sales PROCON]"]),
    covidienSalesTrend: toNullableNumber(row["[Covidien Sales Trend]"]),
  }));
}
