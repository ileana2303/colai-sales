import type { ReportCategoryKey } from "@/lib/bi-reports/reportCategories.types";
import {
  joinDaxQuery,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";
import {
  readNumber,
  readString,
} from "@/lib/bi-reports/powerBiRowParsing";
import type { AreaCategoryTargetsRow } from "@/lib/bi-reports/areaCategoryTargets.types";

export type { AreaCategoryTargetsRow };

export const AREA_CATEGORY_TARGET_KEYS = [
  "coloplast-travma",
  "coloplast-akrateia",
  "amoena",
  "abbott",
  "porges",
  "covidien",
] as const satisfies readonly ReportCategoryKey[];

function normalizeArea(area: string | null | undefined): string {
  return String(area ?? "")
    .trim()
    .toLocaleUpperCase("el-GR");
}

export function buildAreaCategoryTargetsQuery(): string {
  return joinDaxQuery([
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    '  "coloplast-travma", ROUND([WC Total Target], 0),',
    '  "coloplast-akrateia", ROUND([CC TARGET ALL], 0),',
    '  "amoena", ROUND([Sales Target Amoena], 0),',
    '  "abbott", ROUND([Sales Target Abbott], 0),',
    '  "porges", ROUND([SALES TARGET PORGES], 0),',
    '  "covidien", ROUND([Covidien Sales Target], 0)',
    ")",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Base,",
    '  "Area", \'U Sales Person\'[Area],',
    '  "coloplast-travma", [coloplast-travma],',
    '  "coloplast-akrateia", [coloplast-akrateia],',
    '  "amoena", [amoena],',
    '  "abbott", [abbott],',
    '  "porges", [porges],',
    '  "covidien", [covidien]',
    ")",
    "ORDER BY [Area]",
  ]);
}

export function normalizeAreaCategoryTargetsRows(
  response: PowerBiExecuteQueriesResponse,
): AreaCategoryTargetsRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    "coloplast-travma": readNumber(row, "coloplast-travma"),
    "coloplast-akrateia": readNumber(row, "coloplast-akrateia"),
    amoena: readNumber(row, "amoena"),
    abbott: readNumber(row, "abbott"),
    porges: readNumber(row, "porges"),
    covidien: readNumber(row, "covidien"),
  }));
}

export function findAreaCategoryTargetsRow(
  rows: AreaCategoryTargetsRow[],
  area: string,
): AreaCategoryTargetsRow | null {
  const normalizedTarget = normalizeArea(area);
  if (!normalizedTarget) return null;

  return (
    rows.find((row) => normalizeArea(row.area) === normalizedTarget) ?? null
  );
}
