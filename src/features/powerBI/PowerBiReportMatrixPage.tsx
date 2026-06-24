"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  createReportMatrixSectionSummaries,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { fetchPowerBiAreaReport } from "@/lib/api/powerbi";
import { useSellersStore } from "@/stores/sellersStore";

type MatrixReportPayload = {
  area: string;
  headerLabel: string;
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
};

type PowerBiReportMatrixPageProps = {
  brandLabel: string;
  caption: string;
  categoryOrder?: string[];
  currentSalesPath: string;
  currentYear: number;
  emptyMessage: string;
  fallbackError: string;
  previousSalesPath: string;
  previousYear: number;
  reportKey: string;
  trendPath: string;
};

const matrixQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

function getUniqueGroup2Label(...rowGroups: PowerBiMatrixSourceRow[][]) {
  const labels = new Set(
    rowGroups
      .flat()
      .map((row) => row.group2?.trim() ?? "")
      .filter(Boolean),
  );

  return labels.size === 1 ? [...labels][0]! : "";
}

async function fetchMatrixPayload({
  currentSalesPath,
  currentYear,
  fallbackError,
  previousSalesPath,
  previousYear,
  trendPath,
}: Pick<
  PowerBiReportMatrixPageProps,
  | "currentSalesPath"
  | "currentYear"
  | "fallbackError"
  | "previousSalesPath"
  | "previousYear"
  | "trendPath"
>): Promise<MatrixReportPayload> {
  const [current, previous, trend] = await Promise.all([
    fetchPowerBiAreaReport<PowerBiMatrixSourceRow>(
      currentSalesPath,
      `${fallbackError}: ${currentYear}`,
    ),
    fetchPowerBiAreaReport<PowerBiMatrixSourceRow>(
      previousSalesPath,
      `${fallbackError}: ${previousYear}`,
    ),
    fetchPowerBiAreaReport<PowerBiMatrixSourceRow>(
      trendPath,
      `${fallbackError}: trend`,
    ),
  ]);

  return {
    area: current.area ?? previous.area ?? trend.area ?? "",
    headerLabel: getUniqueGroup2Label(
      current.records,
      previous.records,
      trend.records,
    ),
    currentRows: current.records,
    previousRows: previous.records,
    trendRows: trend.records,
  };
}

export function PowerBiReportMatrixPage({
  brandLabel,
  caption,
  categoryOrder,
  currentSalesPath,
  currentYear,
  emptyMessage,
  fallbackError,
  previousSalesPath,
  previousYear,
  reportKey,
  trendPath,
}: PowerBiReportMatrixPageProps) {
  const sellersCatalog = useSellersStore((state) => state.records);
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: powerBiKeys.reportMatrix(
      reportKey,
      currentSalesPath,
      previousSalesPath,
      trendPath,
    ),
    queryFn: () =>
      fetchMatrixPayload({
        currentSalesPath,
        currentYear,
        fallbackError,
        previousSalesPath,
        previousYear,
        trendPath,
      }),
    ...matrixQueryOptions,
  });
  const headerLabel = data?.headerLabel || brandLabel;
  const sectionSummaries = useMemo(
    () => (data ? createReportMatrixSectionSummaries(data.currentRows) : {}),
    [data],
  );

  const sections = useMemo(
    () =>
      createReportMatrixSections({
        currentYear,
        previousYear,
        summaries: sectionSummaries,
      }),
    [currentYear, previousYear, sectionSummaries],
  );
  const rows = useMemo(
    () =>
      data
        ? buildReportMatrixRows({
            categoryOrder,
            currentRows: data.currentRows,
            previousRows: data.previousRows,
            trendRows: data.trendRows,
            sellersCatalog,
          })
        : [],
    [categoryOrder, data, sellersCatalog],
  );
  return (
    <div className="app-page">
      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError={fallbackError}
        onRetry={() => void refetch()}
      >
        {rows.length ? (
          <ReportMatrixTable
            brandLabel={brandLabel}
            caption={caption}
            exportFileName={`${reportKey}-matrix`}
            headerLabel={headerLabel}
            leadingColumns={reportMatrixLeadingColumns}
            rows={rows}
            sections={sections}
          />
        ) : (
          <div className="app-card text-muted-foreground p-5 text-center">
            {emptyMessage}
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
