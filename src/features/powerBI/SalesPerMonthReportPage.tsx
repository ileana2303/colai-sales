"use client";

import React from "react";

import AppLoader from "@/components/ui/AppLoader";
import {
  MetricCard,
  ReportError,
  ReportHeader,
} from "@/features/powerBI/ReportShared";
import {
  buildPowerBiReportApiUrl,
  type PowerBiReportTargetProps,
} from "@/features/powerBI/reportApi";
import {
  accentColors,
  formatCurrency,
  getMonthLabel,
} from "@/lib/bi-reports/reportUtils";
import { parseProxyJson } from "@/lib/api/client";
import type {
  MonthlySalesRow,
  SalesPerMonthResponse,
} from "@/lib/bi-reports/biReports";
import { formatIntGR } from "@/lib/utils/number";

function MonthlySalesChart({ rows }: { rows: MonthlySalesRow[] }) {
  const maxSales = Math.max(...rows.map((row) => row.sales), 1);

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">Πωλήσεις ανά μήνα</div>
          <div className="small text-secondary">Power BI dataset</div>
        </div>
        <span className="badge rounded-pill bg-body-tertiary text-body border">
          {formatIntGR(rows.length)} μήνες
        </span>
      </div>

      <div className="d-flex flex-column mt-3 gap-3">
        {rows.map((row, index) => {
          const width = Math.max(8, (row.sales / maxSales) * 100);
          const accent = accentColors[index % accentColors.length];

          return (
            <div key={row.month}>
              <div className="d-flex align-items-center justify-content-between small mb-1 gap-2">
                <span className="fw-semibold">{getMonthLabel(row.month)}</span>
                <span className="text-body fw-semibold">
                  {formatCurrency(row.sales)}
                </span>
              </div>
              <div
                className="rounded-pill bg-body-tertiary"
                style={{ height: 11, overflow: "hidden" }}
                role="presentation"
              >
                <div
                  className="rounded-pill h-100"
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
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">Αναλυτικές γραμμές</div>
          <div className="small text-secondary">Πωλήσεις ανά μήνα</div>
        </div>
        <i className="bi bi-table text-secondary" aria-hidden />
      </div>

      <div className="d-flex flex-column mt-3 gap-2">
        {rows.map((row) => (
          <div
            key={`${row.sellerCode}-${row.month}`}
            className="rounded-4 bg-body-tertiary p-2"
          >
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="min-w-0">
                <div className="small text-secondary">{row.month}</div>
              </div>
              <div className="fw-semibold flex-shrink-0">
                {formatCurrency(row.sales)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesPerMonthReportPage({
  workspaceId,
  datasetId,
}: PowerBiReportTargetProps = {}) {
  const [records, setRecords] = React.useState<MonthlySalesRow[]>([]);
  const [sellerCode, setSellerCode] = React.useState("");
  const [sellerName, setSellerName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const apiUrl = React.useMemo(
    () =>
      buildPowerBiReportApiUrl("/api/powerbi/sales-per-month", {
        workspaceId,
        datasetId,
      }),
    [workspaceId, datasetId],
  );

  const loadSalesPerMonth = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await parseProxyJson<SalesPerMonthResponse>(
        res,
        "Failed to load Power BI sales per month",
      );

      setRecords(data.records ?? []);
      setSellerCode(data.sellerCode ?? "");
      setSellerName(data.sellerName ?? "");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Power BI sales per month";
      setError(message);
      setRecords([]);
      setSellerCode("");
      setSellerName("");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    void loadSalesPerMonth();
  }, [loadSalesPerMonth]);

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
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title="Πωλήσεις ανά μήνα"
        subtitle={sellerLabel}
        icon="bi-clipboard-data"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadSalesPerMonth()} />
      ) : records.length ? (
        <>
          <section className="row g-3">
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
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν στοιχεία πωλήσεων.
        </div>
      )}
    </div>
  );
}
