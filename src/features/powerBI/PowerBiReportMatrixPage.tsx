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
import {
  ReportMatrixTable,
  type ReportMatrixRow,
} from "@/features/powerBI/ReportMatrixTable";
import {
  buildReportMatrixRows,
  createReportMatrixSections,
  createReportMatrixSectionSummaries,
  reportMatrixLeadingColumns,
  type PowerBiMatrixSourceRow,
} from "@/features/powerBI/reportMatrixData";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { RefreshSnapshotButton } from "@/features/powerBI/RefreshSnapshotButton";
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
import { useSellersStore } from "@/stores/sellersStore";
import { cn } from "@/lib/utils";

type MatrixReportPayload = {
  area: string;
  headerLabel: string;
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
  precalculatedRows?: ReportMatrixRow[];
  /** Set when this payload was read from Supabase instead of live Power BI. */
  snapshotDate?: string;
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
  /**
   * When set, the table is populated from the sales_snapshots row for this
   * page_code (via v_available_snapshots) whenever one is available, instead
   * of querying Power BI live. It also ensures a same-day snapshot row
   * exists for future loads.
   */
  snapshotPageCode?: string;
  /**
   * Some pages store more than one business view under the same page_code
   * (e.g. AMOENA "SALES" vs "ΠΕΡΙΣΤΑΤΙΚΑ"). Set this to the currency flag
   * (0 or 1) used by this view's Power BI queries to select the matching
   * subset of snapshot rows.
   */
  snapshotCurrency?: 0 | 1;
  /** ISO date of a user-selected historical snapshot. */
  snapshotDate?: string;
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

function formatSnapshotDescription(snapshotDate: string | undefined) {
  if (!snapshotDate) return undefined;

  const parsed = new Date(`${snapshotDate}T00:00:00`);
  const formatted = Number.isNaN(parsed.getTime())
    ? snapshotDate
    : parsed.toLocaleDateString("el-GR");

  return `Δεδομένα από στιγμιότυπο (Supabase) της ${formatted}`;
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
  const selectedLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("el-GR")
    : "Latest snapshot";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select a past snapshot"
        disabled={isLoading}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm font-medium whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? "Loading snapshots…" : selectedLabel}
        <AppIcon name="bi-chevron-down" size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Available snapshots</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={(snapshotDate) =>
            onChange(String(snapshotDate) || undefined)
          }
        >
          <DropdownMenuRadioItem value="">
            Latest snapshot
          </DropdownMenuRadioItem>
          {data?.snapshots.map((snapshot) => (
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

  // This endpoint calls ensureSnapshot: it returns today's cached rows when
  // available, otherwise refreshes the Power BI triptych and persists today's
  // snapshot before returning the new Supabase rows.
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
  snapshotCurrency,
  snapshotDate,
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
          caption={caption}
          description={formatSnapshotDescription(data?.snapshotDate)}
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
  snapshotPageCode,
  currentYear,
  previousYear,
  ...props
}: PowerBiReportMatrixPageProps) {
  const [snapshotDate, setSnapshotDate] = useState<string>();

  return (
    <div className="app-page">
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
        caption={caption}
      />
      <PowerBiReportMatrixView
        brandLabel={brandLabel}
        caption={caption}
        exportFileName={`${reportKey}-matrix`}
        reportKey={reportKey}
        snapshotPageCode={snapshotPageCode}
        currentYear={currentYear}
        previousYear={previousYear}
        {...props}
        snapshotDate={snapshotDate}
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
  const [snapshotDates, setSnapshotDates] = useState<Record<string, string>>();
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];
  const snapshotPageCode = activeTab?.view.snapshotPageCode;
  const currentYear = activeTab?.view.currentYear;
  const previousYear = activeTab?.view.previousYear;
  const snapshotDate = activeTab ? snapshotDates?.[activeTab.key] : undefined;

  return (
    <div className="app-page">
      <ReportMatrixPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {snapshotPageCode &&
            currentYear != null &&
            previousYear != null ? (
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
          snapshotDate={snapshotDates?.[tab.key] || undefined}
        />
      ))}
    </div>
  );
}
