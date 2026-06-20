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
import { useSalesPerMonthReport } from "@/features/powerBI/hooks/usePowerBiReports";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  MetricCard,
  ReportHeader,
} from "@/features/powerBI/ReportShared";
import {
  accentColors,
  formatCurrency,
  getMonthLabel,
} from "@/lib/bi-reports/reportUtils";
import type { MonthlySalesRow } from "@/lib/bi-reports/biReports";
import { formatIntGR } from "@/lib/utils/number";

function MonthlySalesChart({ rows }: { rows: MonthlySalesRow[] }) {
  const maxSales = Math.max(...rows.map((row) => row.sales), 1);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Πωλήσεις ανά μήνα</div>
          <div className="text-sm text-muted-foreground">Power BI dataset</div>
        </div>
        <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs text-foreground">
          {formatIntGR(rows.length)} μήνες
        </span>
      </div>

      <div className="flex flex-col mt-3 gap-3">
        {rows.map((row, index) => {
          const width = Math.max(8, (row.sales / maxSales) * 100);
          const accent = accentColors[index % accentColors.length];

          return (
            <div key={row.month}>
              <div className="flex items-center justify-between text-sm mb-1 gap-2">
                <span className="font-semibold">{getMonthLabel(row.month)}</span>
                <span className="text-foreground font-semibold">
                  {formatCurrency(row.sales)}
                </span>
              </div>
              <div
                className="rounded-full bg-muted"
                style={{ height: 11, overflow: "hidden" }}
                role="presentation"
              >
                <div
                  className="rounded-full h-full"
                  style={{
                    width: `${width}%`,
                    background: accent,
                    boxShadow: `0 6px 16px ${accent}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataRows({ rows }: { rows: MonthlySalesRow[] }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικές γραμμές</div>
          <div className="text-sm text-muted-foreground">Πωλήσεις ανά μήνα</div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μήνας</TableHead>
              <TableHead className="text-right">Πωλήσεις</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.sellerCode}-${row.month}`}>
                <TableCell>{row.month}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(row.sales)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SalesPerMonthReportPage() {
  const { data, error, isLoading, isError, refetch } = useSalesPerMonthReport();

  const records = data?.records ?? [];
  const sellerCode = data?.sellerCode ?? "";
  const sellerName = data?.sellerName ?? "";

  const totalSales = records.reduce((sum, row) => sum + row.sales, 0);
  const averageSales = records.length ? totalSales / records.length : 0;
  const bestMonth = records.reduce<MonthlySalesRow | null>(
    (best, row) => (!best || row.sales > best.sales ? row : best),
    null,
  );
  const latestMonth = records.at(-1);
  const sellerLabel =
    sellerName || sellerCode
      ? `${sellerName || "Πωλητής"}${sellerCode ? ` • ${sellerCode}` : ""}`
      : "Πωλήσεις πωλητή ανά μήνα";

  return (
    <div className="app-page">
      <ReportHeader
        title="Πωλήσεις ανά μήνα"
        subtitle={sellerLabel}
        icon="bi-clipboard-data"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load Power BI sales per month"
        onRetry={() => void refetch()}
      >
        {records.length ? (
        <>
          <section className="app-metric-grid">
            <MetricCard
              label="Σύνολο περιόδου"
              value={formatCurrency(totalSales)}
              icon="bi-cash-stack"
              accent="#2563eb"
            />
            <MetricCard
              label="Μέσος μήνας"
              value={formatCurrency(averageSales)}
              icon="bi-activity"
              accent="#16a34a"
            />
            <MetricCard
              label="Καλύτερος μήνας"
              value={bestMonth ? getMonthLabel(bestMonth.month) : "-"}
              icon="bi-stars"
              accent="#f97316"
            />
            <MetricCard
              label="Τελευταίος μήνας"
              value={latestMonth ? formatCurrency(latestMonth.sales) : "-"}
              icon="bi-calendar2-week"
              accent="#7c3aed"
            />
          </section>

          <MonthlySalesChart rows={records} />

          <DataRows rows={records} />
        </>
        ) : (
        <div className="app-card p-5 text-center text-muted-foreground">
          Δεν βρέθηκαν στοιχεία πωλήσεων.
        </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
