import {
  escapeDaxString,
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

function getBbmSalesQueryContext(areaName: string) {
  const area = escapeDaxString(areaName);
  const businessUnits = quoteDaxStrings(BBM_BUSINESS_UNITS);

  return { area, businessUnits };
}

export function buildBbmSales2025Query(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'U Item Family Code'[ItemFamilyCode (groups)], 'UBussiness'[BusinessUnit], 'U Months'[Month], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}), "REPORT_CODE", "P06VALL-VLY", "REPORT_DESC", "BBM Sales by AREA, GROUP and Business Unit", "VCY", [Sales LY]) VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", 'U Item Family Code'[ItemFamilyCode (groups)], "Group2", 'UBussiness'[BusinessUnit], "Month", 'U Months'[Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "VLY", [VCY]) ORDER BY [Area], [Team], [SellerName], [Group1], [Group2], [Month]`;
}

export function buildBbmSales2026Query(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'U Item Family Code'[ItemFamilyCode (groups)], 'UBussiness'[BusinessUnit], 'U Months'[Month], 'U Months'[Status of Closed Month], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}), "REPORT_CODE", "P06VALL-VCYTRCY", "REPORT_DESC", "BBM Sales and Target by AREA, GROUP and Business Unit", "VCY", [Sales], "TCY", [Target Triplex BBM API]) VAR __Filtered = FILTER(__Base, NOT(ISBLANK([VCY])) || NOT(ISBLANK([TCY]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "SellerName", 'U Sales Person'[Πωλητής], "Group1", 'U Item Family Code'[ItemFamilyCode (groups)], "Group2", 'UBussiness'[BusinessUnit], "Month", 'U Months'[Month], "ClosedMonthStatus", 'U Months'[Status of Closed Month], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "Currency", 1, "VCY", [VCY], "TCY", [TCY]) ORDER BY [Area], [Team], [SellerName], [Group1], [Group2], [Month]`;
}

export function buildBbmTrendQuery(areaName: string): string {
  const { area, businessUnits } = getBbmSalesQueryContext(areaName);

  return `DEFINE VAR __Base = SUMMARIZECOLUMNS('U Sales Person'[Area], 'U Sales Person'[Team], 'U Sales Person'[SellerCode], 'U Item Family Code'[ItemFamilyCode (groups)], 'UBussiness'[BusinessUnit], FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"), FILTER('UBussiness', 'UBussiness'[BusinessUnit] IN {${businessUnits}}), "REPORT_CODE", "P06VALL-VTREND", "REPORT_DESC", "BBM Sales Trend by AREA, GROUP and Business Unit", "VTrend", [Sales Trend], "TargetFilter", CALCULATE([Target Triplex BBM API]), "CURRENCY", 1) VAR __Filtered = FILTER(__Base, [VTrend] > 0 && NOT(ISBLANK([VTrend])) && [TargetFilter] > 0 && NOT(ISBLANK([TargetFilter]))) EVALUATE SELECTCOLUMNS(__Filtered, "Area", 'U Sales Person'[Area], "Team", 'U Sales Person'[Team], "SellerCode", 'U Sales Person'[SellerCode], "Group1", 'U Item Family Code'[ItemFamilyCode (groups)], "Group2", 'UBussiness'[BusinessUnit], "REPORT_CODE", [REPORT_CODE], "REPORT_DESC", [REPORT_DESC], "VTrend", [VTrend], "CURRENCY", [CURRENCY]) ORDER BY [Area], [Team], [SellerCode], [Group1], [Group2]`;
}

export function normalizeBbmSales2025Rows(
  response: PowerBiExecuteQueriesResponse,
): BbmSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    sellerName: readString(row, "SellerName"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    month: readString(row, "Month"),
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    vcy: readNumber(row, "VLY") ?? readNumber(row, "VCY"),
  }));
}

export function normalizeBbmSales2026Rows(
  response: PowerBiExecuteQueriesResponse,
): BbmSalesRow[] {
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

export function normalizeBbmTrendRows(
  response: PowerBiExecuteQueriesResponse,
): BbmTrendRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    team: readString(row, "Team"),
    sellerCode: readString(row, "SellerCode"),
    group1: readString(row, "Group1"),
    group2: readString(row, "Group2"),
    reportCode: readString(row, "REPORT_CODE"),
    reportDesc: readString(row, "REPORT_DESC"),
    vTrend: readNumber(row, "VTrend"),
  }));
}
