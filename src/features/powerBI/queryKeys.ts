export const powerBiKeys = {
  all: ["powerbi"] as const,
  salesPerMonth: () => [...powerBiKeys.all, "sales-per-month"] as const,
  salesPerYear: () => [...powerBiKeys.all, "sales-per-year"] as const,
  akrateia: () => [...powerBiKeys.all, "akrateia"] as const,
  covidienSales: (apiPath: string) =>
    [...powerBiKeys.all, "covidien-sales", apiPath] as const,
  covidienTrends: () => [...powerBiKeys.all, "covidien-trends"] as const,
  reportMatrix: (
    reportKey: string,
    currentSalesPath: string,
    previousSalesPath: string,
    trendPath: string,
  ) =>
    [
      ...powerBiKeys.all,
      "report-matrix",
      reportKey,
      currentSalesPath,
      previousSalesPath,
      trendPath,
    ] as const,
  bbmSales: (apiPath: string) =>
    [...powerBiKeys.all, "bbm-sales", apiPath] as const,
  bbmTrends: () => [...powerBiKeys.all, "bbm-trends"] as const,
  porgesSales: (apiPath: string) =>
    [...powerBiKeys.all, "porges-sales", apiPath] as const,
  porgesTrends: () => [...powerBiKeys.all, "porges-trends"] as const,
};
