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

function getPorgesSalesQueryContext(areaName: string) {
  return { area: escapeDaxString(areaName) };
}

export function buildPorgesSalesLastYearQuery(areaName: string): string {
  const { area } = getPorgesSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    "  'U Months'[Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    '  "REPORT_CODE", "P05VALL-VLY",',
    '  "REPORT_DESC", "Porges Sales by Sales Person and Group LY",',
    '  "Currency", 1,',
    '  "VCY", [Sales]',
    ")",
    "VAR __Filtered = FILTER(__Base, [VCY] <> 0)",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "Area", \'U Sales Person\'[Area],',
    '  "Team", \'U Sales Person\'[Team],',
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "SellerName", \'U Sales Person\'[Πωλητής],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "Month", \'U Months\'[Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VLY", [VCY]',
    ")",
    "ORDER BY [Area], [Team], [SellerName], [Group1], [Group2], [Month]",
  ]);
}

function buildPorgesSales2026BaseQuery(
  areaName: string,
  rowFilter: string,
): string {
  const { area } = getPorgesSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Sales Person'[Πωλητής],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    "  'U Months'[Month],",
    "  'U Months'[Status of Closed Month],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    '  "REPORT_CODE", "P05VALL-VCYTCY",',
    '  "REPORT_DESC", "Porges Sales, Target and Trend by Sales Person and Group",',
    '  "Currency", 1,',
    '  "VCY", [Sales],',
    '  "TCY", [SALES TARGET PORGES]',
    ")",
    `VAR __Filtered = FILTER(__Base, ${rowFilter})`,
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "Area", \'U Sales Person\'[Area],',
    '  "Team", \'U Sales Person\'[Team],',
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "SellerName", \'U Sales Person\'[Πωλητής],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "Month", \'U Months\'[Month],',
    '  "ClosedMonthStatus", \'U Months\'[Status of Closed Month],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VCY", [VCY],',
    '  "TCY", [TCY]',
    ")",
    "ORDER BY [Area], [Team], [SellerName], [Group1], [Group2], [Month]",
  ]);
}

export function buildPorgesSalesQuery(areaName: string): string {
  return buildPorgesSales2026BaseQuery(areaName, "[TCY] > 0");
}

export function buildPorgesSalesTargetsTrendsQuery(areaName: string): string {
  return buildPorgesSales2026BaseQuery(
    areaName,
    "NOT(ISBLANK([VCY])) || NOT(ISBLANK([TCY]))",
  );
}

export function buildPorgesTrendQuery(areaName: string): string {
  const { area } = getPorgesSalesQueryContext(areaName);

  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    "  'U Sales Person'[Team],",
    "  'U Sales Person'[SellerCode],",
    "  'U Item Family Code'[Porges Group],",
    "  'U Item Family Code'[Porges SUB],",
    `  FILTER('U Sales Person', 'U Sales Person'[Area] = "${area}"),`,
    '  "REPORT_CODE", "P05VALL-VTREND",',
    '  "REPORT_DESC", "Porges Sales Trend by Sales Person and Group",',
    '  "Currency", 1,',
    '  "VTrend", [Sales Trend],',
    '  "TargetFilter", CALCULATE([SALES TARGET PORGES])',
    ")",
    "VAR __Filtered = FILTER(__Base, [VTrend] > 0 && NOT(ISBLANK([VTrend])) && [TargetFilter] > 0 && NOT(ISBLANK([TargetFilter])))",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Filtered,",
    '  "Area", \'U Sales Person\'[Area],',
    '  "Team", \'U Sales Person\'[Team],',
    '  "SellerCode", \'U Sales Person\'[SellerCode],',
    '  "Group1", \'U Item Family Code\'[Porges Group],',
    '  "Group2", \'U Item Family Code\'[Porges SUB],',
    '  "REPORT_CODE", [REPORT_CODE],',
    '  "REPORT_DESC", [REPORT_DESC],',
    '  "Currency", [Currency],',
    '  "VTrend", [VTrend]',
    ")",
    "ORDER BY [Area], [Team], [SellerCode], [Group1], [Group2]",
  ]);
}

export function normalizePorgesSales2025Rows(
  response: PowerBiExecuteQueriesResponse,
): PorgesSalesRow[] {
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

export function normalizePorgesSalesRows(
  response: PowerBiExecuteQueriesResponse,
): PorgesSalesRow[] {
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

export function normalizePorgesTrendRows(
  response: PowerBiExecuteQueriesResponse,
): PorgesTrendRow[] {
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
