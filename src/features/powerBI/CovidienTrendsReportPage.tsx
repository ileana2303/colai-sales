"use client";

import React from "react";

import { useCovidienTrendsReport } from "@/features/powerBI/hooks/usePowerBiReports";
import {
  PowerBiTable,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { ReportHeader } from "@/features/powerBI/ReportShared";
import type { CovidienTrendRow } from "@/lib/bi-reports/covidien";
import {
  formatNullableCurrency,
  formatNullableInt,
} from "@/lib/bi-reports/reportUtils";

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
    header: "Family Group",
    exportValue: (row) => row.group1,
    render: (row) => row.group1 || "-",
  },
  {
    key: "group2",
    header: "Business Unit",
    exportValue: (row) => row.group2,
    render: (row) => row.group2 || "-",
  },
  {
    key: "reportCode",
    header: "Report Code",
    exportValue: (row) => row.reportCode,
    render: (row) => row.reportCode || "-",
  },
  {
    key: "reportDesc",
    header: "Description",
    exportValue: (row) => row.reportDesc,
    render: (row) => (
      <span className="block max-w-[16rem] whitespace-normal break-words">
        {row.reportDesc || "-"}
      </span>
    ),
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
    header: "V Trend",
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
    label: "Family Group",
    getValue: (row) => row.group1,
  },
  {
    key: "group2",
    label: "Business Unit",
    getValue: (row) => row.group2,
  },
];

export function CovidienTrendsReportPage() {
  const { data, error, isLoading, isError, refetch } =
    useCovidienTrendsReport();
  const records = data?.records ?? [];
  const area = data?.area ?? "";

  return (
    <div className="app-page">
      <ReportHeader
        title="Covidien Trends"
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-activity"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load Covidien trends"
        onRetry={() => void refetch()}
      >
        {records.length ? (
          <PowerBiTable
            tableId="covidien-trends"
            columns={covidienTrendColumns}
            exportFileName="covidien-trends"
            filters={covidienTrendFilters}
            getRowKey={(row, index) =>
              `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.group2}-${index}`
            }
            rows={records}
            title="Covidien Trends data"
            subtitle="Power BI Data for Covidien Sales Trend"
          />
        ) : (
          <div className="app-card p-5 text-center text-muted-foreground">
            Δεν βρέθηκαν Covidien trend στοιχεία για το area του login.
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
