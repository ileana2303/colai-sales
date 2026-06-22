"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAkrateiaReport,
  fetchSalesPerMonthReport,
  fetchSalesPerYearReport,
} from "@/lib/api/powerbi";
import { powerBiKeys } from "@/features/powerBI/queryKeys";

const powerBiQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

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
