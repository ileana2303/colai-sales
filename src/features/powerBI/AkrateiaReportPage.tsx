"use client";

import React from "react";

import AppLoader from "@/components/ui/AppLoader";
import {
  MetricCard,
  ReportError,
  ReportHeader,
  TargetBar,
  ValuePill,
} from "@/features/powerBI/ReportShared";
import {
  buildPowerBiReportApiUrl,
  type PowerBiReportTargetProps,
} from "@/features/powerBI/reportApi";
import {
  accentColors,
  formatCurrency,
  formatNullableCurrency,
  formatNullableInt,
  formatNullableNumber,
  formatNullableRatioPercent,
  getMonthIndex,
  getMonthLabel,
  sumNullable,
} from "@/lib/bi-reports/reportUtils";
import { parseProxyJson } from "@/lib/api/client";
import type {
  AkrateiaCoverSummary,
  AkrateiaPermanentRow,
  AkrateiaResponse,
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
    <div className="app-card p-3">
      <div className="fw-semibold">{title}</div>
      <div className="small text-secondary mt-1">{subtitle}</div>
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

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-bold">{getMonthLabel(row.month)}</div>
          <div className="small text-secondary">CC sales και targets</div>
        </div>
        <span
          className="badge rounded-pill flex-shrink-0"
          style={{
            background: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(row.ccSalesCoverCM)}
        </span>
      </div>

      <div className="row g-2 mt-2">
        <div className="col-6">
          <ValuePill
            label="CC NEW sales"
            value={formatNullableCurrency(row.ccNewSales)}
          />
        </div>
        <div className="col-6">
          <ValuePill
            label="CC REP sales"
            value={formatNullableCurrency(row.ccRepSales)}
          />
        </div>
        <div className="col-6">
          <ValuePill
            label="CC New PERi"
            value={formatNullableInt(row.ccNewPeri)}
          />
        </div>
        <div className="col-6">
          <ValuePill label="CC EKTEL" value={formatNullableInt(row.ccEktel)} />
        </div>
      </div>

      <div className="d-flex flex-column mt-3 gap-3">
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
    <section className="row g-3">
      <MetricCard
        label="% CC Sales Cover"
        value={formatNullableRatioPercent(summary.ccSalesCover)}
        icon="bi-cash-stack"
        accent="#dc2626"
      />
      <MetricCard
        label="% CC NEW PER Cover"
        value={formatNullableRatioPercent(summary.ccNewPerCover)}
        icon="bi-person-plus"
        accent="#7c3aed"
      />
      <MetricCard
        label="% CC REP PER Cover"
        value={formatNullableRatioPercent(summary.ccRepPerCover)}
        icon="bi-arrow-repeat"
        accent="#2563eb"
      />
      <MetricCard
        label="% CC PER Cover"
        value={formatNullableRatioPercent(summary.ccPerCover)}
        icon="bi-bullseye"
        accent="#16a34a"
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

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-bold">{getMonthLabel(row.month)}</div>
          <div className="small text-secondary">Μόνιμοι και στόχος</div>
        </div>
        <span
          className="badge rounded-pill flex-shrink-0"
          style={{
            background: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(row.peCover)}
        </span>
      </div>

      <div className="row g-2 mt-2">
        <div className="col-6">
          <ValuePill
            label="Μόνιμοι"
            value={formatNullableCurrency(row.monimoiSales)}
          />
        </div>
        <div className="col-6">
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

function PermanentMonthlyBreakdown({ rows }: { rows: AkrateiaPermanentRow[] }) {
  if (!rows.length) return null;

  return (
    <section className="d-flex flex-column gap-2">
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
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">Αναλυτικά στοιχεία</div>
          <div className="small text-secondary">
            Μηνιαίες τιμές από Power BI
          </div>
        </div>
        <i className="bi bi-table text-secondary" aria-hidden />
      </div>

      <div className="table-responsive mt-3">
        <table className="table-sm mb-0 table align-middle">
          <thead>
            <tr className="small text-secondary">
              <th>Μήνας</th>
              <th className="text-end">CC NEW</th>
              <th className="text-end">CC REP</th>
              <th className="text-end">Sales</th>
              <th className="text-end">EKTEL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td className="fw-semibold">{getMonthLabel(row.month)}</td>
                <td className="text-end">
                  {formatNullableCurrency(row.ccNewSales)}
                </td>
                <td className="text-end">
                  {formatNullableCurrency(row.ccRepSales)}
                </td>
                <td className="text-end">
                  {formatNullableCurrency(row.sales)}
                </td>
                <td className="text-end">{formatNullableInt(row.ccEktel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AkrateiaReportPage({
  workspaceId,
  datasetId,
}: PowerBiReportTargetProps = {}) {
  const [records, setRecords] = React.useState<AkrateiaRow[]>([]);
  const [permanentRecords, setPermanentRecords] = React.useState<
    AkrateiaPermanentRow[]
  >([]);
  const [coverSummary, setCoverSummary] =
    React.useState<AkrateiaCoverSummary | null>(null);
  const [sellerCode, setSellerCode] = React.useState("");
  const [sellerName, setSellerName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const apiUrl = React.useMemo(
    () =>
      buildPowerBiReportApiUrl("/api/powerbi/akrateia", {
        workspaceId,
        datasetId,
      }),
    [workspaceId, datasetId],
  );

  const loadAkrateia = React.useCallback(async () => {
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
      const data = await parseProxyJson<AkrateiaResponse>(
        res,
        "Failed to load Power BI akrateia report",
      );

      setRecords(data.records ?? []);
      setPermanentRecords(data.permanentRecords ?? []);
      setCoverSummary(data.coverSummary ?? null);
      setSellerCode(data.sellerCode ?? "");
      setSellerName(data.sellerName ?? "");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Power BI akrateia report";
      setError(message);
      setRecords([]);
      setPermanentRecords([]);
      setCoverSummary(null);
      setSellerCode("");
      setSellerName("");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    void loadAkrateia();
  }, [loadAkrateia]);

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
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title="Ακράτεια"
        subtitle={sellerLabel}
        icon="bi-droplet-half"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadAkrateia()} />
      ) : records.length ? (
        <>
          <ReportSectionTitle
            title="Αποτελέσματα Ακράτειας"
            subtitle="CC sales, PER και εκτελέσεις έως τον τρέχοντα μήνα"
          />

          <section className="row g-3">
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

          <section className="d-flex flex-column gap-2">
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

          <ReportSectionTitle
            title="Κάλυψη ανά Κατηγορία"
            subtitle="Συνολική κάλυψη Ακράτειας ανά κατηγορία"
          />

          <AkrateiaCoverSummaryCards summary={coverSummary} />
        </>
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν στοιχεία ακράτειας.
        </div>
      )}
    </div>
  );
}
