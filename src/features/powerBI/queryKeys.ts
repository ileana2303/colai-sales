export const powerBiKeys = {
  all: ["powerbi"] as const,
  groups: () => [...powerBiKeys.all, "groups"] as const,
  datasets: (groupId: string) =>
    [...powerBiKeys.all, "datasets", groupId] as const,
  salesPerMonth: () => [...powerBiKeys.all, "sales-per-month"] as const,
  salesPerYear: () => [...powerBiKeys.all, "sales-per-year"] as const,
  akrateia: () => [...powerBiKeys.all, "akrateia"] as const,
  covidienSales: (apiPath: string) =>
    [...powerBiKeys.all, "covidien-sales", apiPath] as const,
  covidienTrends: () => [...powerBiKeys.all, "covidien-trends"] as const,
  bbmSales: (apiPath: string) =>
    [...powerBiKeys.all, "bbm-sales", apiPath] as const,
  bbmTrends: () => [...powerBiKeys.all, "bbm-trends"] as const,
};
