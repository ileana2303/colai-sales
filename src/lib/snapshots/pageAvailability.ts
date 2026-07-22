import {
  AREA_CATEGORY_TARGET_KEYS,
  type AreaCategoryTargetsRow,
} from "@/lib/bi-reports/areaCategoryTargets";

/** Category-target keys that gate snapshot refresh for an area. */
const GATED_TARGET_PAGE_CODES: Partial<
  Record<(typeof AREA_CATEGORY_TARGET_KEYS)[number], string>
> = {
  "coloplast-travma": "coloplast-reports",
  "coloplast-akrateia": "akrateia-reports",
  amoena: "amoena-reports",
  abbott: "abbott-reports",
  porges: "porges-reports",
  covidien: "covidien-reports",
};

/** Maps report UI page codes used by ensure/refresh. */
export const REPORT_SNAPSHOT_PAGE_CODES = {
  coloplast: "coloplast-reports",
  akrateia: "akrateia-reports",
  amoena: "amoena-reports",
  abbott: "abbott-reports",
  porges: "porges-reports",
  covidien: "covidien-reports",
  bbm: "bbm-reports",
} as const;

export type ReportSnapshotPageCode =
  (typeof REPORT_SNAPSHOT_PAGE_CODES)[keyof typeof REPORT_SNAPSHOT_PAGE_CODES];

export function getAvailableReportPageCodes(
  record: AreaCategoryTargetsRow | null,
) {
  if (!record) return [];

  return AREA_CATEGORY_TARGET_KEYS.flatMap((key) => {
    const pageCode = GATED_TARGET_PAGE_CODES[key];
    return pageCode && record[key] != null ? [pageCode] : [];
  });
}

export function isReportPageAvailableForArea(
  record: AreaCategoryTargetsRow | null,
  pageCode: string,
) {
  const gatedPageCodes = new Set(Object.values(GATED_TARGET_PAGE_CODES));
  // Ungated pages (e.g. BBM) are allowed whenever report_queries exist.
  if (!gatedPageCodes.has(pageCode)) {
    return true;
  }

  return getAvailableReportPageCodes(record).includes(pageCode);
}
