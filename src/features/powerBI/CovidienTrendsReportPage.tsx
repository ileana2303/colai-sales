"use client";

import React from "react";

import AppLoader from "@/components/ui/AppLoader";
import {
  PowerBiTable,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable";
import { ReportError, ReportHeader } from "@/features/powerBI/ReportShared";
import { parseProxyJson } from "@/lib/api/client";
import type { CovidienTrendRow } from "@/lib/bi-reports/covidien";
import {
  formatNullableCurrency,
  formatNullableInt,
} from "@/lib/bi-reports/reportUtils";

type CovidienTrendsResponse = {
  ok: true;
  report: "covidien_trend_2026";
  year: 2026;
  area: string;
  records: CovidienTrendRow[];
};

const covidienTrendColumns: PowerBiTableColumn<CovidienTrendRow>[] = [
  {
    key: "team",
    header: "Team",
    exportValue: (row) => row.team,
    render: (row) => row.team || "-",
  },
  {
    key: "sellerCode",
    header: "Seller Code",
    exportValue: (row) => row.sellerCode,
    render: (row) => row.sellerCode || "-",
  },
  {
    key: "group1",
    header: "Group1",
    exportValue: (row) => row.group1,
    render: (row) => row.group1 || "-",
  },
  {
    key: "group2",
    header: "Group2",
    exportValue: (row) => row.group2,
    render: (row) => row.group2 || "-",
  },
  {
    key: "reportCode",
    header: "REPORT_CODE",
    exportValue: (row) => row.reportCode,
    render: (row) => row.reportCode || "-",
  },
  {
    key: "reportDesc",
    header: "REPORT_DESC",
    exportValue: (row) => row.reportDesc,
    render: (row) => row.reportDesc || "-",
  },
  {
    key: "currency",
    header: "Currency",
    align: "end",
    exportValue: (row) => row.currency,
    render: (row) => formatNullableInt(row.currency),
    sortValue: (row) => row.currency,
  },
  {
    key: "vTrend",
    header: "VTrend",
    align: "end",
    exportValue: (row) => row.vTrend,
    render: (row) => formatNullableCurrency(row.vTrend),
    sortValue: (row) => row.vTrend,
  },
];

const covidienTrendFilters: PowerBiTableFilter<CovidienTrendRow>[] = [
  {
    key: "team",
    label: "Team",
    getValue: (row) => row.team,
  },
  {
    key: "sellerCode",
    label: "Seller Code",
    getValue: (row) => row.sellerCode,
  },
  {
    key: "group1",
    label: "Group1",
    getValue: (row) => row.group1,
  },
  {
    key: "group2",
    label: "Group2",
    getValue: (row) => row.group2,
  },
];

export function CovidienTrendsReportPage() {
  const [records, setRecords] = React.useState<CovidienTrendRow[]>([]);
  const [area, setArea] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/powerbi/covidien-trend-2026", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await parseProxyJson<CovidienTrendsResponse>(
        res,
        "Failed to load Covidien trends",
      );

      setRecords(data.records ?? []);
      setArea(data.area ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Covidien trends",
      );
      setRecords([]);
      setArea("");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return (
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title="Covidien Trends"
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-activity"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadReport()} />
      ) : records.length ? (
        <PowerBiTable
          columns={covidienTrendColumns}
          exportFileName="covidien-trends"
          filters={covidienTrendFilters}
          getRowKey={(row, index) =>
            `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.group2}-${index}`
          }
          rows={records}
          title="Covidien Trends data"
          subtitle="Power BI Data for Covidien Sales Trend"
          maxHeight={720}
        />
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν Covidien trend στοιχεία για το area του login.
        </div>
      )}
    </div>
  );
}
