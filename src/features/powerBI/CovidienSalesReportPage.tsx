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
import { parseProxyJson } from "@/lib/api/client";
import type { CovidienSalesRow } from "@/lib/bi-reports/covidien";
import {
  formatNullableCurrency,
  formatNullableRatioPercent,
  sumNullable,
} from "@/lib/bi-reports/reportUtils";
import { formatIntGR } from "@/lib/utils/number";

type CovidienSalesYear = 2025 | 2026;

type CovidienSalesResponse = {
  ok: true;
  report: "covidien_sales_2025" | "covidien_sales_2026";
  year: CovidienSalesYear;
  area: string;
  records: CovidienSalesRow[];
};

type CovidienSalesReportPageProps = {
  apiPath:
    | "/api/powerbi/covidien-sales-2025"
    | "/api/powerbi/covidien-sales-2026";
  year: CovidienSalesYear;
};

type AggregatedRow = {
  key: string;
  label: string;
  sales: number | null;
  target: number | null;
  coverage: number | null;
  records: number;
};

function aggregateRows(
  rows: CovidienSalesRow[],
  getKey: (row: CovidienSalesRow) => string,
  getLabel: (row: CovidienSalesRow) => string,
): AggregatedRow[] {
  const groups = new Map<string, AggregatedRow>();

  rows.forEach((row) => {
    const key = getKey(row) || "-";
    const current =
      groups.get(key) ??
      ({
        key,
        label: getLabel(row) || key,
        sales: 0,
        target: 0,
        coverage: null,
        records: 0,
      } satisfies AggregatedRow);

    current.sales = (current.sales ?? 0) + (row.salesProcon ?? 0);
    current.target = (current.target ?? 0) + (row.covidienSalesTarget ?? 0);
    current.records += 1;
    current.coverage =
      current.target != null && current.target > 0
        ? (current.sales ?? 0) / current.target
        : null;
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort(
    (a, b) => (b.sales ?? 0) - (a.sales ?? 0),
  );
}

function countUnique(
  rows: CovidienSalesRow[],
  selector: (row: CovidienSalesRow) => string,
) {
  return new Set(rows.map((row) => selector(row).trim()).filter(Boolean)).size;
}

function FamilyBreakdown({ rows }: { rows: CovidienSalesRow[] }) {
  if (!rows.length) return null;

  const familyRows = aggregateRows(
    rows,
    (row) => row.familyGroup,
    (row) => row.familyGroup,
  );

  return (
    <section className="d-flex flex-column gap-2">
      <div className="app-card p-3">
        <div className="fw-semibold">Family groups</div>
        <div className="small text-secondary mt-1">
          Sales PROCON σε σχέση με Covidien Sales Target
        </div>
      </div>

      {familyRows.map((row) => (
        <div key={row.key} className="app-card p-3">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="min-w-0">
              <div className="fw-bold text-truncate">{row.label}</div>
              <div className="small text-secondary">
                {formatIntGR(row.records)} γραμμές
              </div>
            </div>
            <span className="badge rounded-pill bg-body-tertiary text-body flex-shrink-0 border">
              {formatNullableRatioPercent(row.coverage)}
            </span>
          </div>

          <div className="mt-3">
            <TargetBar
              label="Sales PROCON"
              actual={row.sales}
              target={row.target}
              coverage={row.coverage}
              accent="#2563eb"
              formatValue={formatNullableCurrency}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

function SellerTable({ rows }: { rows: CovidienSalesRow[] }) {
  if (!rows.length) return null;

  const sellerRows = aggregateRows(
    rows,
    (row) => row.sellerCode || row.sellerName,
    (row) =>
      `${row.sellerName || "Πωλητής"}${row.sellerCode ? ` • ${row.sellerCode}` : ""}`,
  );

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">Πωλητές</div>
          <div className="small text-secondary">
            Σύνολα ανά πωλητή για το logged-in area
          </div>
        </div>
        <i className="bi bi-table text-secondary" aria-hidden />
      </div>

      <div className="table-responsive mt-3">
        <table className="table-sm mb-0 table align-middle">
          <thead>
            <tr className="small text-secondary">
              <th>Πωλητής</th>
              <th className="text-end">Sales PROCON</th>
              <th className="text-end">Target</th>
              <th className="text-end">% Cover</th>
            </tr>
          </thead>
          <tbody>
            {sellerRows.map((row) => (
              <tr key={row.key}>
                <td className="fw-semibold">{row.label}</td>
                <td className="text-end">
                  {formatNullableCurrency(row.sales)}
                </td>
                <td className="text-end">
                  {formatNullableCurrency(row.target)}
                </td>
                <td className="text-end">
                  {formatNullableRatioPercent(row.coverage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthRows({ rows }: { rows: CovidienSalesRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">Αναλυτικές γραμμές</div>
          <div className="small text-secondary">
            Month, status και family group από Power BI
          </div>
        </div>
        <span className="badge rounded-pill bg-body-tertiary text-body border">
          {formatIntGR(rows.length)}
        </span>
      </div>

      <div className="d-flex flex-column mt-3 gap-2">
        {rows.slice(0, 80).map((row, index) => (
          <div
            key={`${row.sellerCode}-${row.familyGroup}-${row.month}-${index}`}
            className="rounded-4 bg-body-tertiary p-2"
          >
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div className="min-w-0">
                <div className="fw-semibold text-truncate">
                  {row.month || "-"} • {row.familyGroup || "-"}
                </div>
                <div className="small text-secondary text-truncate">
                  {row.sellerName || "Πωλητής"}{" "}
                  {row.closedMonthStatus ? `• ${row.closedMonthStatus}` : ""}
                </div>
              </div>
              <div className="flex-shrink-0 text-end">
                <div className="fw-semibold">
                  {formatNullableCurrency(row.salesProcon)}
                </div>
                <div className="small text-secondary">
                  {formatNullableRatioPercent(row.proconCover)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CovidienSalesReportPage({
  apiPath,
  year,
}: CovidienSalesReportPageProps) {
  const [records, setRecords] = React.useState<CovidienSalesRow[]>([]);
  const [area, setArea] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiPath, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await parseProxyJson<CovidienSalesResponse>(
        res,
        `Failed to load Covidien sales ${year}`,
      );

      setRecords(data.records ?? []);
      setArea(data.area ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to load Covidien sales ${year}`,
      );
      setRecords([]);
      setArea("");
    } finally {
      setLoading(false);
    }
  }, [apiPath, year]);

  React.useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const totalSales = sumNullable(records, (row) => row.salesProcon);
  const totalTarget = sumNullable(records, (row) => row.covidienSalesTarget);
  const totalCover = totalTarget > 0 ? totalSales / totalTarget : null;
  const sellerCount = countUnique(records, (row) => row.sellerCode);
  const familyCount = countUnique(records, (row) => row.familyGroup);
  const monthCount = countUnique(records, (row) => row.month);

  return (
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title={`Covidien Sales ${year}`}
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-graph-up-arrow"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadReport()} />
      ) : records.length ? (
        <>
          <section className="row g-3">
            <MetricCard
              label="Sales PROCON"
              value={formatNullableCurrency(totalSales)}
              icon="bi-cash-stack"
              accent="#2563eb"
            />
            <MetricCard
              label="Covidien Target"
              value={formatNullableCurrency(totalTarget)}
              icon="bi-bullseye"
              accent="#16a34a"
            />
            <MetricCard
              label="% PROCON Cover"
              value={formatNullableRatioPercent(totalCover)}
              icon="bi-pie-chart"
              accent="#7c3aed"
            />
            <MetricCard
              label="Πωλητές"
              value={formatIntGR(sellerCount)}
              icon="bi-people"
              accent="#f97316"
            />
          </section>

          <section className="row g-3">
            <div className="col-6">
              <ValuePill
                label="Family groups"
                value={formatIntGR(familyCount)}
              />
            </div>
            <div className="col-6">
              <ValuePill label="Μήνες" value={formatIntGR(monthCount)} />
            </div>
          </section>

          <FamilyBreakdown rows={records} />
          <SellerTable rows={records} />
          <MonthRows rows={records} />
        </>
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν Covidien στοιχεία για το area του login.
        </div>
      )}
    </div>
  );
}
