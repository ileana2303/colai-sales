"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAkrateiaReport,
  fetchBbmSalesReport,
  fetchBbmTrendsReport,
  fetchCovidienSalesReport,
  fetchCovidienTrendsReport,
  fetchPowerBiDatasets,
  fetchPowerBiGroups,
  fetchSalesPerMonthReport,
  fetchSalesPerYearReport,
} from "@/lib/api/powerbi";
import { powerBiKeys } from "@/features/powerBI/queryKeys";

const powerBiQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

export function usePowerBiGroups() {
  return useQuery({
    queryKey: powerBiKeys.groups(),
    queryFn: fetchPowerBiGroups,
    ...powerBiQueryOptions,
  });
}

export function usePowerBiDatasets(groupId: string) {
  return useQuery({
    queryKey: powerBiKeys.datasets(groupId),
    queryFn: () => fetchPowerBiDatasets(groupId),
    enabled: Boolean(groupId),
    ...powerBiQueryOptions,
  });
}

export function useSalesPerMonthReport() {
  return useQuery({
    queryKey: powerBiKeys.salesPerMonth(),
    queryFn: fetchSalesPerMonthReport,
    ...powerBiQueryOptions,
  });
}

export function useSalesPerYearReport() {
  return useQuery({
    queryKey: powerBiKeys.salesPerYear(),
    queryFn: fetchSalesPerYearReport,
    ...powerBiQueryOptions,
  });
}

export function useAkrateiaReport() {
  return useQuery({
    queryKey: powerBiKeys.akrateia(),
    queryFn: fetchAkrateiaReport,
    ...powerBiQueryOptions,
  });
}

export function useCovidienSalesReport(
  apiPath: string,
  year: number | string,
) {
  return useQuery({
    queryKey: powerBiKeys.covidienSales(apiPath),
    queryFn: () => fetchCovidienSalesReport(apiPath, year),
    ...powerBiQueryOptions,
  });
}

export function useCovidienTrendsReport() {
  return useQuery({
    queryKey: powerBiKeys.covidienTrends(),
    queryFn: fetchCovidienTrendsReport,
    ...powerBiQueryOptions,
  });
}

export function useBbmSalesReport(apiPath: string, year: number | string) {
  return useQuery({
    queryKey: powerBiKeys.bbmSales(apiPath),
    queryFn: () => fetchBbmSalesReport(apiPath, year),
    ...powerBiQueryOptions,
  });
}

export function useBbmTrendsReport() {
  return useQuery({
    queryKey: powerBiKeys.bbmTrends(),
    queryFn: fetchBbmTrendsReport,
    ...powerBiQueryOptions,
  });
}
