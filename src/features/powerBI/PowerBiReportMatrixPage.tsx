"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { fetchPowerBiAreaReport } from "@/lib/api/powerbi";

type MatrixReportPayload = {
  area: string;
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

  const sections = useMemo(
    () => createReportMatrixSections({ currentYear, previousYear }),
    [currentYear, previousYear],
  );
  const rows = useMemo(
    () =>
      data
        ? buildReportMatrixRows({
            categoryOrder,
            currentRows: data.currentRows,
            previousRows: data.previousRows,
            trendRows: data.trendRows,
          })
        : [],
    [categoryOrder, data],
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
