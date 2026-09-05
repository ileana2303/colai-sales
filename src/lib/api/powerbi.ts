import { parseProxyJson, API_NO_CACHE_HEADERS } from "@/lib/api/client";
import type {
  AkrateiaResponse,
  SalesPerMonthResponse,
  SalesPerYearResponse,
} from "@/lib/bi-reports/biReports";
import type {
  AreaCategoryTargetsResponse,
  AreaReportResponse,
  PowerBiSellersResponse,
} from "@/lib/api/powerbi.types";

export type {
  AreaCategoryTargetsResponse,
  AreaReportResponse,
  PowerBiSellersResponse,
};

async function fetchPowerBi<T>(
  path: string,
  fallbackError: string,
): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    headers: API_NO_CACHE_HEADERS,
  });
  return parseProxyJson<T>(res, fallbackError);
}

export function fetchPowerBiAreaReport<TRow>(
  apiPath: string,
  fallbackError: string,
) {
  return fetchPowerBi<AreaReportResponse<TRow>>(apiPath, fallbackError);
}

export function fetchSalesPerMonthReport() {
  return fetchPowerBi<SalesPerMonthResponse>(
    "/api/powerbi/sales-per-month",
    "Failed to load Power BI sales per month",
  );
}

export function fetchSalesPerYearReport() {
  return fetchPowerBi<SalesPerYearResponse>(
    "/api/powerbi/sales-per-year",
    "Failed to load Power BI sales per year",
  );
}

export function fetchAkrateiaReport() {
  return fetchPowerBi<AkrateiaResponse>(
    "/api/powerbi/akrateia",
    "Failed to load Power BI akrateia report",
  );
}

export function fetchPowerBiSellers(scope?: "all") {
  const query = scope === "all" ? "?scope=all" : "";

  return fetchPowerBi<PowerBiSellersResponse>(
    `/api/powerbi/sellers${query}`,
    "Failed to load Power BI sellers",
  );
}

export function fetchAreaCategoryTargets() {
  return fetchPowerBi<AreaCategoryTargetsResponse>(
    "/api/powerbi/area-category-targets",
    "Failed to load area category targets",
  );
}
