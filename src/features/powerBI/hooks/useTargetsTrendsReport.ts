"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { powerBiKeys } from "@/features/powerBI/queryKeys";
import {
  fetchBbmSalesReport,
  fetchBbmTrendsReport,
  fetchCovidienSalesReport,
  fetchCovidienTrendsReport,
  fetchPorgesSalesReport,
  fetchPorgesTrendsReport,
} from "@/lib/api/powerbi";
import type { BbmSalesRow, BbmTrendRow } from "@/lib/bi-reports/bbm";
import type { CovidienSalesRow, CovidienTrendRow } from "@/lib/bi-reports/covidien";
import type { PorgesSalesRow, PorgesTrendRow } from "@/lib/bi-reports/porges";
import {
  buildTargetsTrendsAnalysis,
  type TargetsTrendsAnalysis,
  type TargetsTrendsAnalysisOptions,
  type TargetsTrendsSalesRow,
  type TargetsTrendsTrendRow,
} from "@/lib/bi-reports/targetsTrends";

const powerBiQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

export type TargetsTrendsBusinessUnit = "covidien" | "bbm" | "porges";

function toSalesRow(
  row: BbmSalesRow | CovidienSalesRow | PorgesSalesRow,
): TargetsTrendsSalesRow {
  return {
    area: row.area,
    team: row.team,
    sellerCode: row.sellerCode,
    sellerName: row.sellerName,
    group1: row.group1,
    group2: row.group2,
    month: row.month,
    closedMonthStatus: row.closedMonthStatus,
    vcy: row.vcy,
    tcy: row.tcy ?? null,
  };
}

function toTrendRow(
  row: BbmTrendRow | CovidienTrendRow | PorgesTrendRow,
): TargetsTrendsTrendRow {
  return {
    area: row.area,
    team: row.team,
    sellerCode: row.sellerCode,
    group1: row.group1,
    group2: row.group2,
    vTrend: row.vTrend,
  };
}

const CONFIG = {
  covidien: {
    sales2026Path: "/api/powerbi/covidien-sales-2026",
    sales2025Path: "/api/powerbi/covidien-sales-2025",
    fetchSales2026: () => fetchCovidienSalesReport("/api/powerbi/covidien-sales-2026", 2026),
    fetchSales2025: () => fetchCovidienSalesReport("/api/powerbi/covidien-sales-2025", 2025),
    fetchTrends: fetchCovidienTrendsReport,
    salesKey: powerBiKeys.covidienSales,
    trendsKey: powerBiKeys.covidienTrends,
  },
  bbm: {
    sales2026Path: "/api/powerbi/bbm-sales-2026",
    sales2025Path: "/api/powerbi/bbm-sales-2025",
    fetchSales2026: () => fetchBbmSalesReport("/api/powerbi/bbm-sales-2026", 2026),
    fetchSales2025: () => fetchBbmSalesReport("/api/powerbi/bbm-sales-2025", 2025),
    fetchTrends: fetchBbmTrendsReport,
    salesKey: powerBiKeys.bbmSales,
    trendsKey: powerBiKeys.bbmTrends,
  },
  porges: {
    sales2026Path: "/api/powerbi/porges-sales-2026-targets",
    sales2025Path: "/api/powerbi/porges-sales-2025",
    fetchSales2026: () =>
      fetchPorgesSalesReport("/api/powerbi/porges-sales-2026-targets", 2026),
    fetchSales2025: () => fetchPorgesSalesReport("/api/powerbi/porges-sales-2025", 2025),
    fetchTrends: fetchPorgesTrendsReport,
    salesKey: powerBiKeys.porgesSales,
    trendsKey: powerBiKeys.porgesTrends,
  },
} as const;

const ANALYSIS_OPTIONS: Partial<
  Record<TargetsTrendsBusinessUnit, TargetsTrendsAnalysisOptions>
> = {
  porges: {
    grain: "group1Group2",
    includeTrendOnlyGroups: true,
  },
  bbm: {
    grain: "group1Group2",
    includeTrendOnlyGroups: true,
  },
};

export function useTargetsTrendsReport(businessUnit: TargetsTrendsBusinessUnit) {
  const config = CONFIG[businessUnit];

  const [sales2026Query, sales2025Query, trendsQuery] = useQueries({
    queries: [
      {
        queryKey: config.salesKey(config.sales2026Path),
        queryFn: config.fetchSales2026,
        ...powerBiQueryOptions,
      },
      {
        queryKey: config.salesKey(config.sales2025Path),
        queryFn: config.fetchSales2025,
        ...powerBiQueryOptions,
      },
      {
        queryKey: config.trendsKey(),
        queryFn: config.fetchTrends,
        ...powerBiQueryOptions,
      },
    ],
  });

  const sales2026 = sales2026Query.data?.records ?? [];
  const sales2025 = sales2025Query.data?.records ?? [];
  const trends = trendsQuery.data?.records ?? [];
  const area =
    sales2026Query.data?.area ??
    sales2025Query.data?.area ??
    trendsQuery.data?.area ??
    "";

  const analysis = useMemo<TargetsTrendsAnalysis>(() => {
    return buildTargetsTrendsAnalysis(
      sales2026.map(toSalesRow),
      sales2025.map(toSalesRow),
      trends.map(toTrendRow),
      ANALYSIS_OPTIONS[businessUnit],
    );
  }, [businessUnit, sales2026, sales2025, trends]);

  const isLoading =
    sales2026Query.isLoading ||
    sales2025Query.isLoading ||
    trendsQuery.isLoading;
  const isError =
    sales2026Query.isError || sales2025Query.isError || trendsQuery.isError;
  const error =
    sales2026Query.error ?? sales2025Query.error ?? trendsQuery.error ?? null;

  function refetch() {
    void sales2026Query.refetch();
    void sales2025Query.refetch();
    void trendsQuery.refetch();
  }

  return {
    analysis,
    area,
    error,
    isError,
    isLoading,
    refetch,
  };
}
