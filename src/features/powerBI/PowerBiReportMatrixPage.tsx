"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportMatrixChatShell } from "@/features/chat";
import {
  ReportMatrixTable,
} from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  createReportMatrixSectionSummaries,
  createReportMatrixSectionSummariesFromPeriodMeta,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { RefreshSnapshotButton } from "@/features/powerBI/RefreshSnapshotButton";
import { buildSnapshotPeriodSummaryItems } from "@/features/powerBI/reportMatrixPeriodSummary";
import type {
  MatrixReportPayload,
  PowerBiReportMatrixPageProps,
  PowerBiReportMatrixViewProps,
  PowerBiTabbedReportMatrixPageProps,
} from "@/features/powerBI/types/PowerBiReportMatrixPage.types";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  filterSnapshotRowsByCurrency,
  mapSnapshotRowsToMatrixRows,
} from "@/features/powerBI/snapshotMatrixSource";
import { fetchPowerBiAreaReport } from "@/lib/api/powerbi";
import {
  fetchAvailableReportSnapshots,
  fetchReportSnapshot,
} from "@/lib/api/snapshots";
import type { AvailableSnapshot } from "@/lib/snapshots/types";
import { useSellersStore } from "@/stores/sellersStore";
import { cn } from "@/lib/utils";

export type { PowerBiReportMatrixViewProps } from "@/features/powerBI/types/PowerBiReportMatrixPage.types";

const matrixQueryOptions = {
  staleTime: 60_000,
  retry: 1,
} as const;

function ReportMatrixPageHeader({
  actions,
  brandLabel,
  periodSummary,
}: {
  actions?: ReactNode;
  brandLabel: string;
  periodSummary?: ReactNode;
}) {
  return (
    <section className="app-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 shrink-0">
          <h1 className="app-report-title mb-0">{brandLabel}</h1>
        </div>
        {periodSummary ? (
          <div className="report-matrix-period-slot min-w-0 flex-1 lg:px-4">
            {periodSummary}
          </div>
        ) : null}
        {actions}
      </div>
    </section>
  );
}

function SnapshotPeriodSummaryPill({
  snapshot,
}: {
  snapshot: AvailableSnapshot | null | undefined;
}) {
  const items = useMemo(
    () => buildSnapshotPeriodSummaryItems(snapshot),
    [snapshot],
  );

  if (!items.length) return null;

  return (
    <div className="snapshot-period-summary" aria-label="Περίοδος στιγμιοτύπου">
      {items.map((item) => (
        <div key={item.key} className="snapshot-period-summary__item">
          <span className="snapshot-period-summary__label">{item.label}</span>
          <strong className="snapshot-period-summary__value">
            {item.value}
          </strong>
          {item.hint ? (
            <span className="snapshot-period-summary__hint">{item.hint}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function useActiveAvailableSnapshot(
  pageCode: string | undefined,
  year: number | undefined,
  snapshotDate: string | undefined,
) {
  const { data } = useQuery({
    queryKey: powerBiKeys.availableReportSnapshots(pageCode ?? "", year ?? 0),
    queryFn: () =>
      fetchAvailableReportSnapshots({
        pageCode: pageCode!,
        year: year!,
      }),
    enabled: Boolean(pageCode && year != null),
    ...matrixQueryOptions,
  });

  return useMemo(() => {
    const snapshots = data?.snapshots ?? [];
    if (!snapshots.length) return null;
    if (snapshotDate) {
      return (
        snapshots.find((snapshot) => snapshot.snapshot_date === snapshotDate) ??
        null
      );
    }
    return snapshots[0] ?? null;
  }, [data?.snapshots, snapshotDate]);
}

function formatSnapshotDescription(snapshotDate: string | undefined) {
  if (!snapshotDate) return undefined;

  const parsed = new Date(`${snapshotDate}T00:00:00`);
  const formatted = Number.isNaN(parsed.getTime())
    ? snapshotDate
    : parsed.toLocaleDateString("el-GR");

  return `Δεδομένα από στιγμιότυπο της ${formatted}`;
}

function SnapshotPicker({
  pageCode,
  year,
  value,
  onChange,
}: {
  pageCode: string;
  year: number;
  value?: string;
  onChange: (snapshotDate: string | undefined) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: powerBiKeys.availableReportSnapshots(pageCode, year),
    queryFn: () => fetchAvailableReportSnapshots({ pageCode, year }),
    ...matrixQueryOptions,
  });
  const snapshots = data?.snapshots ?? [];
  const latestDate = snapshots[0]?.snapshot_date;
  const historicalSnapshots = snapshots.filter(
    (snapshot) => snapshot.snapshot_date !== latestDate,
  );
  const selectedValue = value && value !== latestDate ? value : "";
  const selectedLabel = selectedValue
    ? new Date(`${selectedValue}T00:00:00`).toLocaleDateString("el-GR")
    : "Latest snapshot";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select a past snapshot"
        disabled={isLoading}
        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-4 text-sm font-medium whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? "Loading snapshots…" : selectedLabel}
        <AppIcon name="bi-chevron-down" size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Available snapshots</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={selectedValue}
          onValueChange={(snapshotDate) =>
            onChange(String(snapshotDate) || undefined)
          }
        >
          <DropdownMenuRadioItem value="">
            Latest snapshot
          </DropdownMenuRadioItem>
          {historicalSnapshots.map((snapshot) => (
            <DropdownMenuRadioItem
              key={snapshot.snapshot_date}
              value={snapshot.snapshot_date}
            >
              {new Date(
                `${snapshot.snapshot_date}T00:00:00`,
              ).toLocaleDateString("el-GR")}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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

async function fetchMatrixPayloadFromSnapshot({
  currentYear,
  previousYear,
  snapshotCurrency,
  snapshotDate,
  snapshotPageCode,
}: Pick<
  PowerBiReportMatrixViewProps,
  | "currentYear"
  | "previousYear"
  | "snapshotCurrency"
  | "snapshotDate"
  | "snapshotPageCode"
>): Promise<MatrixReportPayload | null> {
  if (!snapshotPageCode) return null;

  // This endpoint calls ensureSnapshot: it returns cached rows from the last
  // 7 days when available, otherwise refreshes the Power BI triptych and
  // persists today's snapshot before returning the new Supabase rows.
  const response = await fetchReportSnapshot({
    pageCode: snapshotPageCode,
    year: currentYear,
    compareYear: previousYear,
    snapshotDate,
  });

  if (!response.rows.length) return null;

  const rows = filterSnapshotRowsByCurrency(response.rows, snapshotCurrency);
  if (!rows.length) return null;

  const precalculatedRows = mapSnapshotRowsToMatrixRows(rows);
  if (!precalculatedRows.length) return null;
  const group2Labels = new Set(
    rows.map((row) => row.group2?.trim() ?? "").filter(Boolean),
  );

  return {
    area: response.snapshot?.area ?? "",
    headerLabel: group2Labels.size === 1 ? [...group2Labels][0]! : "",
    currentRows: [],
    previousRows: [],
    trendRows: [],
    precalculatedRows,
    snapshotDate: response.snapshot?.snapshot_date,
    snapshotPeriod: response.snapshot
      ? {
          closedPeriodLabel: response.snapshot.closed_period_label,
          closedMonthsCount: response.snapshot.closed_months_count,
          lastClosedMonth: response.snapshot.last_closed_month,
          openMonthsCount: response.snapshot.open_months_count,
        }
      : undefined,
  };
}

async function fetchMatrixPayloadFromPowerBi({
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

async function fetchMatrixPayload(
  props: Pick<
    PowerBiReportMatrixViewProps,
    | "currentSalesPath"
    | "currentYear"
    | "fallbackError"
    | "previousSalesPath"
    | "previousYear"
    | "snapshotCurrency"
    | "snapshotDate"
    | "snapshotPageCode"
    | "trendPath"
  >,
): Promise<MatrixReportPayload> {
  const snapshotPayload = await fetchMatrixPayloadFromSnapshot(props).catch(
    () => null,
  );
  if (snapshotPayload) return snapshotPayload;

  return fetchMatrixPayloadFromPowerBi(props);
}

export function PowerBiReportMatrixView({
  brandLabel,
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
  snapshotCurrency,
  snapshotDate,
  snapshotPageCode,
  trendPath,
  periodSummary,
}: PowerBiReportMatrixViewProps) {
  const sellersCatalog = useSellersStore((state) => state.records);
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: powerBiKeys.reportMatrix(
      reportKey,
      currentSalesPath,
      previousSalesPath,
      trendPath,
      snapshotPageCode,
      snapshotCurrency,
      snapshotDate,
    ),
    queryFn: () =>
      fetchMatrixPayload({
        currentSalesPath,
        currentYear,
        fallbackError,
        previousSalesPath,
        previousYear,
        snapshotCurrency,
        snapshotDate,
        snapshotPageCode,
        trendPath,
      }),
    ...matrixQueryOptions,
  });

  const headerLabel = headerLabelOverride ?? data?.headerLabel ?? brandLabel;
  const sectionSummaries = useMemo(() => {
    if (!data) return {};
    if (data.currentRows.length) {
      return createReportMatrixSectionSummaries(data.currentRows);
    }
    return createReportMatrixSectionSummariesFromPeriodMeta(
      data.snapshotPeriod,
    );
  }, [data]);

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
        ? (data.precalculatedRows ??
          buildReportMatrixRows({
            categoryOrder,
            currentRows: data.currentRows,
            group2Order,
            previousRows: data.previousRows,
            trendRows: data.trendRows,
            sellersCatalog,
          }))
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
          description={formatSnapshotDescription(data?.snapshotDate)}
          exportFileName={exportFileName}
          group2Order={group2Order}
          headerLabel={headerLabel}
          hideSummaryPill={Boolean(snapshotPageCode)}
          leadingColumns={reportMatrixLeadingColumns}
          periodSummary={periodSummary}
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

export function PowerBiReportMatrixPage({
  brandLabel,
  reportKey,
  snapshotPageCode,
  currentYear,
  previousYear,
  ...props
}: PowerBiReportMatrixPageProps) {
  const [snapshotDate, setSnapshotDate] = useState<string>();
  const activeSnapshot = useActiveAvailableSnapshot(
    snapshotPageCode,
    currentYear,
    snapshotDate,
  );
  const periodSummary = useMemo(
    () =>
      snapshotPageCode
        ? buildSnapshotPeriodSummaryItems(activeSnapshot)
        : undefined,
    [activeSnapshot, snapshotPageCode],
  );

  return (
    <ReportMatrixChatShell
      brandLabel={brandLabel}
      reportKey={reportKey}
      snapshotPageCode={snapshotPageCode}
      currentYear={currentYear}
      previousYear={previousYear}
      snapshotDate={snapshotDate}
    >
      <ReportMatrixPageHeader
        actions={
          snapshotPageCode ? (
            <div className="flex flex-wrap items-center gap-2">
              <RefreshSnapshotButton
                brandLabel={brandLabel}
                pageCode={snapshotPageCode}
                currentYear={currentYear}
                compareYear={previousYear}
              />
              <SnapshotPicker
                pageCode={snapshotPageCode}
                year={currentYear}
                value={snapshotDate}
                onChange={setSnapshotDate}
              />
            </div>
          ) : null
        }
        brandLabel={brandLabel}
        periodSummary={
          snapshotPageCode ? (
            <SnapshotPeriodSummaryPill snapshot={activeSnapshot} />
          ) : null
        }
      />
      <PowerBiReportMatrixView
        brandLabel={brandLabel}
        exportFileName={reportKey}
        reportKey={reportKey}
        snapshotPageCode={snapshotPageCode}
        currentYear={currentYear}
        previousYear={previousYear}
        periodSummary={periodSummary}
        {...props}
        snapshotDate={snapshotDate}
      />
    </ReportMatrixChatShell>
  );
}

export function PowerBiTabbedReportMatrixPage({
  brandLabel,
  tabs,
}: PowerBiTabbedReportMatrixPageProps) {
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.key ?? "");
  const [snapshotDates, setSnapshotDates] = useState<Record<string, string>>();
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];
  const snapshotPageCode = activeTab?.view.snapshotPageCode;
  const currentYear = activeTab?.view.currentYear;
  const previousYear = activeTab?.view.previousYear;
  const snapshotDate = activeTab ? snapshotDates?.[activeTab.key] : undefined;
  const activeSnapshot = useActiveAvailableSnapshot(
    snapshotPageCode,
    currentYear,
    snapshotDate,
  );
  const periodSummary = useMemo(
    () =>
      snapshotPageCode
        ? buildSnapshotPeriodSummaryItems(activeSnapshot)
        : undefined,
    [activeSnapshot, snapshotPageCode],
  );

  return (
    <ReportMatrixChatShell
      brandLabel={brandLabel}
      reportKey={
        activeTab?.view.reportKey ?? tabs[0]?.view.reportKey ?? "report"
      }
      snapshotPageCode={snapshotPageCode}
      currentYear={currentYear}
      previousYear={previousYear}
      snapshotDate={snapshotDate}
      viewLabel={activeTab?.label}
    >
      <ReportMatrixPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {snapshotPageCode && currentYear != null && previousYear != null ? (
              <>
                <RefreshSnapshotButton
                  brandLabel={brandLabel}
                  pageCode={snapshotPageCode}
                  currentYear={currentYear}
                  compareYear={previousYear}
                />
                <SnapshotPicker
                  pageCode={snapshotPageCode}
                  year={currentYear}
                  value={snapshotDate}
                  onChange={(date) => {
                    if (!activeTab) return;
                    setSnapshotDates((dates) => ({
                      ...dates,
                      [activeTab.key]: date ?? "",
                    }));
                  }}
                />
              </>
            ) : null}
            <div
              className="border-border bg-muted/40 inline-flex flex-wrap gap-1 rounded-xl border p-1"
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
          </div>
        }
        brandLabel={brandLabel}
        periodSummary={
          snapshotPageCode ? (
            <SnapshotPeriodSummaryPill snapshot={activeSnapshot} />
          ) : null
        }
      />

      {tabs.map((tab) => (
        <PowerBiReportMatrixView
          key={tab.key}
          hidden={tab.key !== activeTabKey}
          {...tab.view}
          periodSummary={periodSummary}
          snapshotDate={snapshotDates?.[tab.key] || undefined}
        />
      ))}
    </ReportMatrixChatShell>
  );
}
