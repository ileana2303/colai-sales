export const powerBiKeys = {
  all: ["powerbi"] as const,
  reportMatrices: () => [...powerBiKeys.all, "report-matrix"] as const,
  salesPerMonth: () => [...powerBiKeys.all, "sales-per-month"] as const,
  salesPerYear: () => [...powerBiKeys.all, "sales-per-year"] as const,
  akrateia: () => [...powerBiKeys.all, "akrateia"] as const,
  areaCategoryTargets: (area: string) =>
    [...powerBiKeys.all, "area-category-targets", area] as const,
  covidienSales: (apiPath: string) =>
    [...powerBiKeys.all, "covidien-sales", apiPath] as const,
  covidienTrends: () => [...powerBiKeys.all, "covidien-trends"] as const,
  reportMatrix: (
    reportKey: string,
    currentSalesPath: string,
    previousSalesPath: string,
    trendPath: string,
    snapshotPageCode?: string,
    snapshotCurrency?: number,
    snapshotDate?: string,
  ) =>
    [
      ...powerBiKeys.reportMatrices(),
      reportKey,
      currentSalesPath,
      previousSalesPath,
      trendPath,
      snapshotPageCode ?? "",
      snapshotCurrency ?? "",
      snapshotDate ?? "",
    ] as const,
  availableReportSnapshots: (pageCode: string, year: number) =>
    [...powerBiKeys.all, "available-report-snapshots", pageCode, year] as const,
  bbmSales: (apiPath: string) =>
    [...powerBiKeys.all, "bbm-sales", apiPath] as const,
  bbmTrends: () => [...powerBiKeys.all, "bbm-trends"] as const,
  porgesSales: (apiPath: string) =>
    [...powerBiKeys.all, "porges-sales", apiPath] as const,
  porgesTrends: () => [...powerBiKeys.all, "porges-trends"] as const,
  sellers: () => [...powerBiKeys.all, "sellers"] as const,
  reportSnapshot: (
    area: string,
    pageCode: string,
    year: number,
    compareYear: number,
  ) =>
    [
      ...powerBiKeys.all,
      "report-snapshot",
      area,
      pageCode,
      year,
      compareYear,
    ] as const,
};
