"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  createReportMatrixSectionSummaries,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { useEnsureReportSnapshot } from "@/features/powerBI/hooks/useEnsureReportSnapshot";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { fetchPowerBiAreaReport } from "@/lib/api/powerbi";
import { useSellersStore } from "@/stores/sellersStore";
import { cn } from "@/lib/utils";

type MatrixReportPayload = {
  area: string;
  headerLabel: string;
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
};

export type PowerBiReportMatrixViewProps = {
  brandLabel: string;
  caption: string;
  categoryOrder?: string[];
  currentSalesPath: string;
  currentYear: number;
  emptyMessage: string;
  exportFileName: string;
  fallbackError: string;
  group2Order?: string[];
  headerLabel?: string;
  hidden?: boolean;
  previousSalesPath: string;
  previousYear: number;
  reportKey: string;
  /** When set, ensures a same-day sales_snapshots row exists for this page. */
  snapshotPageCode?: string;
  trendPath: string;
};

const matrixQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

function ReportMatrixPageHeader({
  actions,
  brandLabel,
  caption,
}: {
  actions?: ReactNode;
  brandLabel: string;
  caption: string;
}) {
  return (
    <section className="app-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-report-title mb-0">{brandLabel}</h1>
          <p className="app-report-subtitle mb-0">{caption}</p>
        </div>
        {actions}
      </div>
    </section>
  );
}

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
  PowerBiReportMatrixViewProps,
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

export function PowerBiReportMatrixView({
  brandLabel,
  caption,
  categoryOrder,
  currentSalesPath,
  currentYear,
  emptyMessage,
  exportFileName,
  fallbackError,
  group2Order,
  headerLabel: headerLabelOverride,
  hidden = false,
  previousSalesPath,
  previousYear,
  reportKey,
  snapshotPageCode,
  trendPath,
}: PowerBiReportMatrixViewProps) {
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

  useEnsureReportSnapshot({
    area: data?.area,
    pageCode: snapshotPageCode,
    year: currentYear,
    compareYear: previousYear,
    enabled: !hidden && Boolean(snapshotPageCode) && Boolean(data?.area),
  });

  const headerLabel = headerLabelOverride ?? data?.headerLabel ?? brandLabel;
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
            group2Order,
            previousRows: data.previousRows,
            trendRows: data.trendRows,
            sellersCatalog,
          })
        : [],
    [categoryOrder, data, group2Order, sellersCatalog],
  );

  if (hidden) {
    return null;
  }

  return (
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
          exportFileName={exportFileName}
          group2Order={group2Order}
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
  );
}

type PowerBiReportMatrixPageProps = Omit<
  PowerBiReportMatrixViewProps,
  "exportFileName" | "hidden"
>;

export function PowerBiReportMatrixPage({
  brandLabel,
  caption,
  reportKey,
  ...props
}: PowerBiReportMatrixPageProps) {
  return (
    <div className="app-page">
      <ReportMatrixPageHeader brandLabel={brandLabel} caption={caption} />
      <PowerBiReportMatrixView
        brandLabel={brandLabel}
        caption={caption}
        exportFileName={`${reportKey}-matrix`}
        reportKey={reportKey}
        {...props}
      />
    </div>
  );
}

type ReportMatrixTab = {
  key: string;
  label: string;
  view: PowerBiReportMatrixViewProps;
};

type PowerBiTabbedReportMatrixPageProps = {
  brandLabel: string;
  caption: string;
  tabs: ReportMatrixTab[];
};

export function PowerBiTabbedReportMatrixPage({
  brandLabel,
  caption,
  tabs,
}: PowerBiTabbedReportMatrixPageProps) {
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.key ?? "");

  return (
    <div className="app-page">
      <ReportMatrixPageHeader
        actions={
          <div
            className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label={`${brandLabel} report views`}
          >
            {tabs.map((tab) => {
              const isActive = tab.key === activeTabKey;

              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    "h-auto rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setActiveTabKey(tab.key)}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>
        }
        brandLabel={brandLabel}
        caption={caption}
      />

      {tabs.map((tab) => (
        <PowerBiReportMatrixView
          key={tab.key}
          hidden={tab.key !== activeTabKey}
          {...tab.view}
        />
      ))}
    </div>
  );
}
