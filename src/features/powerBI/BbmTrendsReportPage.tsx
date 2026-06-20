"use client";

import React from "react";

import { useBbmTrendsReport } from "@/features/powerBI/hooks/usePowerBiReports";
import {
  PowerBiTable,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { ReportHeader } from "@/features/powerBI/ReportShared";
import type { BbmTrendRow } from "@/lib/bi-reports/bbm";
import { formatNullableCurrency } from "@/lib/bi-reports/reportUtils";

const bbmTrendColumns: PowerBiTableColumn<BbmTrendRow>[] = [
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
    key: "vTrend",
    header: "V Trend",
    align: "end",
    exportValue: (row) => row.vTrend,
    render: (row) => formatNullableCurrency(row.vTrend),
    sortValue: (row) => row.vTrend,
  },
];

const bbmTrendFilters: PowerBiTableFilter<BbmTrendRow>[] = [
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

export function BbmTrendsReportPage() {
  const { data, error, isLoading, isError, refetch } = useBbmTrendsReport();
  const records = data?.records ?? [];
  const area = data?.area ?? "";

  return (
    <div className="app-page">
      <ReportHeader
        title="BBM Trends"
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-activity"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load BBM trends"
        onRetry={() => void refetch()}
      >
        {records.length ? (
          <PowerBiTable
            tableId="bbm-trends"
            columns={bbmTrendColumns}
            exportFileName="bbm-trends"
            filters={bbmTrendFilters}
            getRowKey={(row, index) =>
              `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.group2}-${index}`
            }
            rows={records}
            title="BBM Trends data"
            subtitle="Power BI Data for BBM Sales Trend"
          />
        ) : (
          <div className="app-card p-5 text-center text-muted-foreground">
            Δεν βρέθηκαν BBM trend στοιχεία για το area του login.
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
