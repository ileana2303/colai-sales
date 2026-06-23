"use client";

import React from "react";

import { AppIcon } from "@/components/ui/app-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAkrateiaReport } from "@/features/powerBI/hooks/usePowerBiReports";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  MetricCard,
  ReportHeader,
  ReportToneValue,
  TargetBar,
  ValuePill,
} from "@/features/powerBI/ReportShared";
import {
  accentColors,
  formatCurrency,
  formatNullableCurrency,
  formatNullableInt,
  formatNullableNumber,
  formatNullableRatioPercent,
  getCoverRatioTone,
  getValueToneClassName,
  getMonthIndex,
  getMonthLabel,
  sumNullable,
} from "@/lib/bi-reports/reportUtils";
import { cn } from "@/lib/utils";
import type {
  AkrateiaCoverSummary,
  AkrateiaPermanentRow,
  AkrateiaRow,
} from "@/lib/bi-reports/biReports";
import { formatIntGR } from "@/lib/utils/number";

function getCurrentAthensMonthIndex() {
  const month = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "Europe/Athens",
  }).format(new Date());

  return Number(month) - 1;
}

function filterRowsThroughCurrentMonth<T extends { month: string }>(rows: T[]) {
  const currentMonthIndex = getCurrentAthensMonthIndex();

  return rows.filter((row) => {
    const monthIndex = getMonthIndex(row.month);
    return monthIndex == null || monthIndex <= currentMonthIndex;
  });
}

function ReportSectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="app-card p-5">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

function AkrateiaMonthCard({
  row,
  index,
}: {
  row: AkrateiaRow;
  index: number;
}) {
  const accent = accentColors[(index + 2) % accentColors.length];
  const ccSales =
    row.ccNewSales == null && row.ccRepSales == null
      ? null
      : (row.ccNewSales ?? 0) + (row.ccRepSales ?? 0);
  const coverTone = getCoverRatioTone(row.ccSalesCoverCM);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{getMonthLabel(row.month)}</div>
          <div className="text-sm text-muted-foreground">CC sales και targets</div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium",
            getValueToneClassName(coverTone),
          )}
          style={{
            background: `${accent}1f`,
            color: coverTone ? undefined : accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(row.ccSalesCoverCM)}
        </span>
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-2">
        <div>
          <ValuePill
            label="CC NEW sales"
            value={formatNullableCurrency(row.ccNewSales)}
          />
        </div>
        <div>
          <ValuePill
            label="CC REP sales"
            value={formatNullableCurrency(row.ccRepSales)}
          />
        </div>
        <div>
          <ValuePill
            label="CC New PERi"
            value={formatNullableInt(row.ccNewPeri)}
          />
        </div>
        <div>
          <ValuePill label="CC EKTEL" value={formatNullableInt(row.ccEktel)} />
        </div>
      </div>

      <div className="flex flex-col mt-3 gap-3">
        <TargetBar
          label="CC Sales Target"
          actual={ccSales}
          target={row.ccSalesTarget}
          coverage={row.ccSalesCoverCM}
          accent="#dc2626"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="CC NEW PER Target"
          actual={row.ccNewPeri}
          target={row.ccNewPerTarget}
          coverage={row.ccNewPerCoverCM}
          accent="#7c3aed"
          formatValue={(value) => formatNullableNumber(value)}
        />
        <TargetBar
          label="CC Ektel Target"
          actual={row.ccEktel}
          target={row.ccEktelTarget}
          coverage={row.ccEktelTotalPerRunning}
          accent="#0891b2"
          formatValue={(value) => formatNullableNumber(value)}
        />
      </div>
    </div>
  );
}

function AkrateiaCoverSummaryCards({
  summary,
}: {
  summary: AkrateiaCoverSummary | null;
}) {
  if (!summary) return null;

  return (
    <section className="app-metric-grid">
      <MetricCard
        label="% CC Sales Cover"
        value={formatNullableRatioPercent(summary.ccSalesCover)}
        icon="bi-cash-stack"
        accent="#dc2626"
        tone={getCoverRatioTone(summary.ccSalesCover)}
      />
      <MetricCard
        label="% CC NEW PER Cover"
        value={formatNullableRatioPercent(summary.ccNewPerCover)}
        icon="bi-person-plus"
        accent="#7c3aed"
        tone={getCoverRatioTone(summary.ccNewPerCover)}
      />
      <MetricCard
        label="% CC REP PER Cover"
        value={formatNullableRatioPercent(summary.ccRepPerCover)}
        icon="bi-arrow-repeat"
        accent="#2563eb"
        tone={getCoverRatioTone(summary.ccRepPerCover)}
      />
      <MetricCard
        label="% CC PER Cover"
        value={formatNullableRatioPercent(summary.ccPerCover)}
        icon="bi-bullseye"
        accent="#16a34a"
        tone={getCoverRatioTone(summary.ccPerCover)}
      />
    </section>
  );
}

function PermanentMonthCard({
  row,
  index,
}: {
  row: AkrateiaPermanentRow;
  index: number;
}) {
  const accent = accentColors[(index + 1) % accentColors.length];
  const coverTone = getCoverRatioTone(row.peCover);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{getMonthLabel(row.month)}</div>
          <div className="text-sm text-muted-foreground">Μόνιμοι και στόχος</div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium",
            getValueToneClassName(coverTone),
          )}
          style={{
            background: `${accent}1f`,
            color: coverTone ? undefined : accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(row.peCover)}
        </span>
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-2">
        <div>
          <ValuePill
            label="Μόνιμοι"
            value={formatNullableCurrency(row.monimoiSales)}
          />
        </div>
        <div>
          <ValuePill
            label="Μόνιμοι Sales Target"
            value={formatNullableCurrency(row.monimoiSalesTarget)}
          />
        </div>
      </div>

      <div className="mt-3">
        <TargetBar
          label="% PE Cover"
          actual={row.monimoiSales}
          target={row.monimoiSalesTarget}
          coverage={row.peCover}
          accent={accent}
          formatValue={formatNullableCurrency}
        />
      </div>
    </div>
  );
}

function PermanentCompactTable({ rows }: { rows: AkrateiaPermanentRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικά στοιχεία μόνιμων</div>
          <div className="text-sm text-muted-foreground">
            Μηνιαίες τιμές από Power BI
          </div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μήνας</TableHead>
              <TableHead className="text-right">Μόνιμοι</TableHead>
              <TableHead className="text-right">Στόχος</TableHead>
              <TableHead className="text-right">% PE Cover</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-semibold">
                  {getMonthLabel(row.month)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.monimoiSales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.monimoiSalesTarget)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={getCoverRatioTone(row.peCover)}>
                    {formatNullableRatioPercent(row.peCover)}
                  </ReportToneValue>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PermanentMonthlyBreakdown({ rows }: { rows: AkrateiaPermanentRow[] }) {
  if (!rows.length) return null;

  return (
    <section className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <PermanentMonthCard
          key={`${row.month}-${index}`}
          row={row}
          index={index}
        />
      ))}
    </section>
  );
}

function AkrateiaCompactTable({ rows }: { rows: AkrateiaRow[] }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικά στοιχεία</div>
          <div className="text-sm text-muted-foreground">
            Μηνιαίες τιμές από Power BI
          </div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μήνας</TableHead>
              <TableHead className="text-right">CC NEW</TableHead>
              <TableHead className="text-right">CC REP</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">EKTEL</TableHead>
              <TableHead className="text-right">% CC Cover</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-semibold">
                  {getMonthLabel(row.month)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.ccNewSales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.ccRepSales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.sales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableInt(row.ccEktel)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={getCoverRatioTone(row.ccSalesCoverCM)}>
                    {formatNullableRatioPercent(row.ccSalesCoverCM)}
                  </ReportToneValue>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AkrateiaReportPage() {
  const { data, error, isLoading, isError, refetch } = useAkrateiaReport();

  const records = data?.records ?? [];
  const permanentRecords = data?.permanentRecords ?? [];
  const coverSummary = data?.coverSummary ?? null;
  const sellerCode = data?.sellerCode ?? "";
  const sellerName = data?.sellerName ?? "";

  const visibleRecords = React.useMemo(
    () => filterRowsThroughCurrentMonth(records),
    [records],
  );
  const visiblePermanentRecords = React.useMemo(
    () => filterRowsThroughCurrentMonth(permanentRecords),
    [permanentRecords],
  );
  const totalCcNewSales = sumNullable(visibleRecords, (row) => row.ccNewSales);
  const totalCcRepSales = sumNullable(visibleRecords, (row) => row.ccRepSales);
  const totalCcSales = totalCcNewSales + totalCcRepSales;
  const totalCcSalesTarget = sumNullable(
    visibleRecords,
    (row) => row.ccSalesTarget,
  );
  const totalSalesCover =
    totalCcSalesTarget > 0 ? totalCcSales / totalCcSalesTarget : null;
  const totalSales = sumNullable(visibleRecords, (row) => row.sales);
  const totalEktel = sumNullable(visibleRecords, (row) => row.ccEktel);
  const sellerLabel =
    sellerName || sellerCode
      ? `${sellerName || "Πωλητής"}${sellerCode ? ` • ${sellerCode}` : ""}`
      : "CC sales, PER και εκτελέσεις ανά μήνα";

  return (
    <div className="app-page">
      <ReportHeader
        title="Ακράτεια"
        subtitle={sellerLabel}
        icon="bi-droplet-half"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load Power BI akrateia report"
        onRetry={() => void refetch()}
      >
        {records.length ? (
        <>
          <ReportSectionTitle
            title="Αποτελέσματα Ακράτειας"
            subtitle="CC sales, PER και εκτελέσεις έως τον τρέχοντα μήνα"
          />

          <section className="app-metric-grid">
            <MetricCard
              label="CC Sales"
              value={formatCurrency(totalCcSales)}
              icon="bi-cash-stack"
              accent="#dc2626"
            />
            <MetricCard
              label="Κάλυψη στόχου"
              value={formatNullableRatioPercent(totalSalesCover)}
              icon="bi-bullseye"
              accent="#16a34a"
              tone={getCoverRatioTone(totalSalesCover)}
            />
            <MetricCard
              label="Sales"
              value={formatCurrency(totalSales)}
              icon="bi-graph-up-arrow"
              accent="#2563eb"
            />
            <MetricCard
              label="CC EKTEL"
              value={formatIntGR(totalEktel)}
              icon="bi-check2-circle"
              accent="#0891b2"
            />
          </section>

          <section className="flex flex-col gap-2">
            {visibleRecords.map((row, index) => (
              <AkrateiaMonthCard
                key={`${row.month}-${index}`}
                row={row}
                index={index}
              />
            ))}
          </section>

          <AkrateiaCompactTable rows={visibleRecords} />

          <ReportSectionTitle
            title="Αποτελέσματα Μόνιμων"
            subtitle="Μόνιμοι, στόχοι και % PE Cover έως τον τρέχοντα μήνα"
          />

          <PermanentMonthlyBreakdown rows={visiblePermanentRecords} />

          <PermanentCompactTable rows={visiblePermanentRecords} />

          <ReportSectionTitle
            title="Κάλυψη ανά Κατηγορία"
            subtitle="Συνολική κάλυψη Ακράτειας ανά κατηγορία"
          />

          <AkrateiaCoverSummaryCards summary={coverSummary} />
        </>
        ) : (
        <div className="app-card p-5 text-center text-muted-foreground">
          Δεν βρέθηκαν στοιχεία ακράτειας.
        </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
