import { parseProxyJson } from "@/lib/api/client";
import type {
  AkrateiaResponse,
  BiReportDatasetsResponse,
  BiReportGroupsResponse,
  SalesPerMonthResponse,
  SalesPerYearResponse,
} from "@/lib/bi-reports/biReports";
import type { BbmSalesRow, BbmTrendRow } from "@/lib/bi-reports/bbm";
import type { CovidienSalesRow, CovidienTrendRow } from "@/lib/bi-reports/covidien";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

async function fetchPowerBi<T>(path: string, fallbackError: string): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    headers: NO_CACHE_HEADERS,
  });
  return parseProxyJson<T>(res, fallbackError);
}

export type AreaReportResponse<TRow> = {
  ok: true;
  area?: string;
  records: TRow[];
};

export function fetchPowerBiGroups() {
  return fetchPowerBi<BiReportGroupsResponse>(
    "/api/powerbi/groups",
    "Failed to load Power BI groups",
  );
}

export function fetchPowerBiDatasets(groupId: string) {
  return fetchPowerBi<BiReportDatasetsResponse>(
    `/api/powerbi/groups/${encodeURIComponent(groupId)}/datasets`,
    "Failed to load Power BI datasets",
  );
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

export function fetchCovidienSalesReport(apiPath: string, year: number | string) {
  return fetchPowerBi<AreaReportResponse<CovidienSalesRow>>(
    apiPath,
    `Failed to load Covidien sales ${year}`,
  );
}

export function fetchCovidienTrendsReport() {
  return fetchPowerBi<AreaReportResponse<CovidienTrendRow>>(
    "/api/powerbi/covidien-trend-2026",
    "Failed to load Covidien trends",
  );
}

export function fetchBbmSalesReport(apiPath: string, year: number | string) {
  return fetchPowerBi<AreaReportResponse<BbmSalesRow>>(
    apiPath,
    `Failed to load BBM sales ${year}`,
  );
}

export function fetchBbmTrendsReport() {
  return fetchPowerBi<AreaReportResponse<BbmTrendRow>>(
    "/api/powerbi/bbm-trends-2026",
    "Failed to load BBM trends",
  );
}
