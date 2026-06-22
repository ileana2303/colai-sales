"use client";

import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PowerBiTableHeaderFilter } from "@/features/powerBI/PowerBiTable/PowerBiTableHeaderFilter";
import { PowerBiTableToolbar } from "@/features/powerBI/PowerBiTable/PowerBiTableToolbar";
import type { FilterOption } from "@/features/powerBI/PowerBiTable/types";
import { exportTargetsTrendsToExcel } from "@/features/powerBI/targetsTrendsExport";
import {
  useTargetsTrendsReport,
  type TargetsTrendsBusinessUnit,
} from "@/features/powerBI/hooks/useTargetsTrendsReport";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  MetricCard,
  ReportHeader,
  TargetBar,
  ValuePill,
} from "@/features/powerBI/ReportShared";
import type {
  TargetsTrendsGroupMetrics,
  TargetsTrendsMetrics,
} from "@/lib/bi-reports/targetsTrends";
import {
  formatNullableCurrency,
  formatNullableRatioPercent,
} from "@/lib/bi-reports/reportUtils";
import { formatIntGR } from "@/lib/utils/number";

type TargetsTrendsReportPageProps = {
  businessUnit: TargetsTrendsBusinessUnit;
  group1Label?: string;
  group2Label?: string;
  groupSectionTitle?: string;
  subtitle: string;
  title: string;
};

function ClosedMonthsSection({ metrics }: { metrics: TargetsTrendsMetrics }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="app-card p-5">
        <div className="font-semibold">Πωλήσεις κλεισμένων μηνών</div>
      </div>

      <section className="app-metric-grid app-metric-grid--2">
        <MetricCard
          label="Στόχος (κλειστά)"
          value={formatNullableCurrency(metrics.closedTarget)}
          icon="bi-bullseye"
          accent="#16a34a"
        />
        <MetricCard
          label="Πωλήσεις (κλειστά)"
          value={formatNullableCurrency(metrics.closedSales)}
          icon="bi-cash-stack"
          accent="#2563eb"
        />
        <MetricCard
          label="Διαφορά"
          value={formatNullableCurrency(metrics.closedDiff)}
          icon="bi-activity"
          accent="#f97316"
        />
        <MetricCard
          label="Cover %"
          value={formatNullableRatioPercent(metrics.closedCover)}
          icon="bi-pie-chart"
          accent="#7c3aed"
        />
      </section>

      <div className="app-card p-5">
        <TargetBar
          label="Cover κλειστών μηνών"
          actual={metrics.closedSales}
          target={metrics.closedTarget}
          coverage={metrics.closedCover}
          accent="#2563eb"
          formatValue={formatNullableCurrency}
        />
      </div>

      <section className="app-metric-grid app-metric-grid--3">
        <ValuePill
          label="Πωλήσεις LY (ίδιοι μήνες)"
          value={formatNullableCurrency(metrics.closedSalesLy)}
        />
        <ValuePill
          label="LY / CY %"
          value={formatNullableRatioPercent(metrics.closedLyCover)}
        />
        <ValuePill
          label="CY − LY"
          value={formatNullableCurrency(metrics.closedLyDiff)}
        />
      </section>
    </section>
  );
}

function GapSection({ metrics }: { metrics: TargetsTrendsMetrics }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="app-card p-5">
        <div className="font-semibold">Ετήσιος στόχος vs Trend</div>
        <div className="text-muted-foreground mt-1 text-sm">
          Σύγκριση συνολικού στόχου 2026 με άθροισμα trend ανά family group
        </div>
      </div>

      <section className="app-metric-grid app-metric-grid--2">
        <MetricCard
          label="Στόχος 2026 (όλοι οι μήνες)"
          value={formatNullableCurrency(metrics.annualTarget)}
          icon="bi-bullseye"
          accent="#16a34a"
        />
        <MetricCard
          label="Trend σύνολο"
          value={formatNullableCurrency(metrics.trendTotal)}
          icon="bi-activity"
          accent="#7c3aed"
        />
        <MetricCard
          label="Diff gap (Trend − Στόχος)"
          value={formatNullableCurrency(metrics.diffGap)}
          icon="bi-graph-up-arrow"
          accent="#f97316"
        />
        <MetricCard
          label="Trend / Στόχος %"
          value={formatNullableRatioPercent(metrics.trendCover)}
          icon="bi-pie-chart"
          accent="#2563eb"
        />
      </section>
    </section>
  );
}

function OpenMonthsSection({ metrics }: { metrics: TargetsTrendsMetrics }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="app-card p-5">
        <div className="font-semibold">Ανοιχτοί μήνες & extra target</div>
        <div className="text-muted-foreground mt-1 text-sm">
          Κατανομή gap στους υπόλοιπους ανοιχτούς μήνες όταν Trend &lt; Στόχος
        </div>
      </div>

      <section className="app-metric-grid app-metric-grid--2">
        <ValuePill
          label="Ανοιχτοί μήνες"
          value={formatIntGR(metrics.openMonthCount)}
        />
        <ValuePill
          label="MIN ανοιχτός μήνας"
          value={metrics.minOpenMonth || "-"}
        />
        <ValuePill
          label="Στόχος MIN ανοιχτού"
          value={formatNullableCurrency(metrics.minOpenMonthTarget)}
        />
        <ValuePill
          label="Extra target / μήνα"
          value={formatNullableCurrency(metrics.extraTarget)}
        />
        <ValuePill
          label="Στόχος + Extra"
          value={formatNullableCurrency(metrics.adjustedOpenTarget)}
        />
      </section>
    </section>
  );
}

function buildGroupFilterOptions(
  groups: TargetsTrendsGroupMetrics[],
  getValue: (row: TargetsTrendsGroupMetrics) => string,
  getLabel?: (row: TargetsTrendsGroupMetrics) => string,
): FilterOption[] {
  const optionsByValue = new Map<string, string>();

  for (const row of groups) {
    const value = getValue(row).trim();
    if (!value) continue;

    const label = (getLabel?.(row) ?? value).trim() || value;
    if (!optionsByValue.has(value)) {
      optionsByValue.set(value, label);
    }
  }

  return [...optionsByValue.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "el"));
}

function GroupBreakdownTable({
  exportFileName,
  group1Label = "Family Group",
  group2Label,
  groupSectionTitle = "Ανά family group",
  groups,
  metrics,
  title,
}: {
  exportFileName: string;
  group1Label?: string;
  group2Label?: string;
  groupSectionTitle?: string;
  groups: TargetsTrendsGroupMetrics[];
  metrics: TargetsTrendsMetrics;
  title: string;
}) {
  const [group1Filter, setGroup1Filter] = useState("");
  const [group2Filter, setGroup2Filter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  const group1Options = useMemo(
    () => buildGroupFilterOptions(groups, (row) => row.group1),
    [groups],
  );
  const group2Options = useMemo(
    () => buildGroupFilterOptions(groups, (row) => row.group2 ?? ""),
    [groups],
  );
  const teamOptions = useMemo(
    () => buildGroupFilterOptions(groups, (row) => row.team),
    [groups],
  );
  const sellerOptions = useMemo(
    () =>
      buildGroupFilterOptions(
        groups,
        (row) => row.sellerCode || row.sellerName,
        (row) => row.sellerName || row.sellerCode,
      ),
    [groups],
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter((row) => {
        if (group1Filter && row.group1 !== group1Filter) return false;
        if (group2Filter && (row.group2 ?? "") !== group2Filter) return false;
        if (teamFilter && row.team !== teamFilter) return false;
        if (
          sellerFilter &&
          (row.sellerCode || row.sellerName) !== sellerFilter
        ) {
          return false;
        }
        return true;
      }),
    [group1Filter, group2Filter, groups, sellerFilter, teamFilter],
  );

  const hasActiveFilters = Boolean(
    group1Filter || group2Filter || teamFilter || sellerFilter,
  );

  function resetFilters() {
    setGroup1Filter("");
    setGroup2Filter("");
    setTeamFilter("");
    setSellerFilter("");
  }

  function exportToExcel() {
    exportTargetsTrendsToExcel({
      exportFileName,
      group1Label,
      group2Label,
      groupSectionTitle,
      groups: filteredGroups,
      metrics,
      title,
    });
  }

  if (!groups.length) return null;

  return (
    <div className="app-card p-5">
      <PowerBiTableToolbar
        hasActiveFilters={hasActiveFilters}
        subtitle="Κλειστά, LY, trend και gap ανά ομάδα · το Excel περιλαμβάνει και τα σύνολα της οθόνης"
        title={groupSectionTitle}
        visibleRowCount={filteredGroups.length || groups.length}
        onExport={exportToExcel}
        onResetFilters={resetFilters}
      />

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead className="min-w-28 align-top">
                <PowerBiTableHeaderFilter
                  label={group1Label}
                  options={group1Options}
                  value={group1Filter}
                  onChange={setGroup1Filter}
                />
              </TableHead>
              {group2Label ? (
                <TableHead className="min-w-28 align-top">
                  <PowerBiTableHeaderFilter
                    label={group2Label}
                    options={group2Options}
                    value={group2Filter}
                    onChange={setGroup2Filter}
                  />
                </TableHead>
              ) : null}
              <TableHead className="min-w-28 align-top">
                <PowerBiTableHeaderFilter
                  label="Team"
                  options={teamOptions}
                  value={teamFilter}
                  onChange={setTeamFilter}
                />
              </TableHead>
              <TableHead className="min-w-28 align-top">
                <PowerBiTableHeaderFilter
                  label="Πωλητής"
                  options={sellerOptions}
                  value={sellerFilter}
                  onChange={setSellerFilter}
                />
              </TableHead>
              <TableHead className="text-right">Κλειστά VCY</TableHead>
              <TableHead className="text-right">Κλειστά TCY</TableHead>
              <TableHead className="text-right">Cover</TableHead>
              <TableHead className="text-right">LY VCY</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead className="text-right">Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length ? (
              filteredGroups.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-semibold">{row.group1}</TableCell>
                  {group2Label ? (
                    <TableCell>{row.group2 || "-"}</TableCell>
                  ) : null}
                  <TableCell>{row.team || "-"}</TableCell>
                  <TableCell>
                    {row.sellerName || row.sellerCode || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableCurrency(row.closedSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableCurrency(row.closedTarget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableRatioPercent(row.closedCover)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableCurrency(row.closedSalesLy)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableCurrency(row.trendTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNullableCurrency(row.diffGap)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={group2Label ? 10 : 9}
                  className="text-muted-foreground py-3 text-center"
                >
                  Δεν βρέθηκαν γραμμές με τα επιλεγμένα φίλτρα.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function TargetsTrendsReportPage({
  businessUnit,
  group1Label,
  group2Label,
  groupSectionTitle,
  subtitle,
  title,
}: TargetsTrendsReportPageProps) {
  const { analysis, area, error, isError, isLoading, refetch } =
    useTargetsTrendsReport(businessUnit);

  return (
    <div className="app-page">
      <ReportHeader
        title={title}
        subtitle={area ? `Area: ${area} · ${subtitle}` : subtitle}
        icon="bi-stars"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError={`Failed to load ${title}`}
        onRetry={refetch}
      >
        <ClosedMonthsSection metrics={analysis.summary} />
        <GapSection metrics={analysis.summary} />
        <OpenMonthsSection metrics={analysis.summary} />
        <GroupBreakdownTable
          exportFileName={`${businessUnit}-targets-trends`}
          group1Label={group1Label}
          group2Label={group2Label}
          groupSectionTitle={groupSectionTitle}
          groups={analysis.groups}
          metrics={analysis.summary}
          title={title}
        />
      </ReportQueryBoundary>
    </div>
  );
}
