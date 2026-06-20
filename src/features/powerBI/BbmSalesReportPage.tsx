"use client";

import React from "react";

import { useBbmSalesReport } from "@/features/powerBI/hooks/usePowerBiReports";
import {
  PowerBiTable,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { ReportHeader } from "@/features/powerBI/ReportShared";
import type { BbmSalesRow } from "@/lib/bi-reports/bbm";
import {
  formatNullableCurrency,
  formatNullableInt,
  getMonthIndex,
} from "@/lib/bi-reports/reportUtils";

type BbmSalesYear = 2025 | 2026;

type BbmSalesReportPageProps = {
  apiPath: "/api/powerbi/bbm-sales-2025" | "/api/powerbi/bbm-sales-2026";
  year: BbmSalesYear;
};

const bbmSalesMainColumns: PowerBiTableColumn<BbmSalesRow>[] = [
  {
    key: "team",
    header: "Team",
    exportValue: (row) => row.team,
    render: (row) => row.team || "-",
  },
  {
    key: "sellerName",
    header: "Πωλητής",
    exportValue: (row) =>
      row.sellerCode
        ? `${row.sellerName || "Πωλητής"} (${row.sellerCode})`
        : row.sellerName,
    render: (row) => (
      <span className="inline-flex items-baseline gap-1">
        <span>{row.sellerName || "-"}</span>
        {row.sellerCode ? (
          <span className="text-sm text-muted-foreground">{row.sellerCode}</span>
        ) : null}
      </span>
    ),
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
    key: "month",
    header: "Μήνας",
    exportValue: (row) => row.month,
    render: (row) => row.month || "-",
    sortValue: (row) => getMonthIndex(row.month) ?? row.month,
  },
];

const bbmSalesStatusColumn: PowerBiTableColumn<BbmSalesRow> = {
  key: "closedMonthStatus",
  header: "Status",
  exportValue: (row) => row.closedMonthStatus,
  render: (row) => row.closedMonthStatus || "-",
};

const bbmSalesReportColumns: PowerBiTableColumn<BbmSalesRow>[] = [
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
];

const bbmSalesCurrencyColumn: PowerBiTableColumn<BbmSalesRow> = {
  key: "currency",
  header: "Currency",
  align: "end",
  exportValue: (row) => row.currency,
  render: (row) => formatNullableInt(row.currency ?? null),
  sortValue: (row) => row.currency,
};

const bbmSalesVcyColumn: PowerBiTableColumn<BbmSalesRow> = {
  key: "vcy",
  header: "VCY",
  align: "end",
  exportValue: (row) => row.vcy,
  render: (row) => formatNullableCurrency(row.vcy),
  sortValue: (row) => row.vcy,
};

const bbmSalesTcyColumn: PowerBiTableColumn<BbmSalesRow> = {
  key: "tcy",
  header: "TCY",
  align: "end",
  exportValue: (row) => row.tcy,
  render: (row) => formatNullableCurrency(row.tcy ?? null),
  sortValue: (row) => row.tcy,
};

const bbmSalesVlyColumn: PowerBiTableColumn<BbmSalesRow> = {
  ...bbmSalesVcyColumn,
  key: "vly",
  header: "VLY",
};

const bbmSales2025Columns: PowerBiTableColumn<BbmSalesRow>[] = [
  ...bbmSalesMainColumns,
  ...bbmSalesReportColumns,
  bbmSalesVlyColumn,
];

const bbmSales2026Columns: PowerBiTableColumn<BbmSalesRow>[] = [
  ...bbmSalesMainColumns,
  bbmSalesStatusColumn,
  ...bbmSalesReportColumns,
  bbmSalesCurrencyColumn,
  bbmSalesVcyColumn,
  bbmSalesTcyColumn,
];

const bbmSalesMainFilters: PowerBiTableFilter<BbmSalesRow>[] = [
  {
    key: "team",
    label: "Team",
    getValue: (row) => row.team,
  },
  {
    columnKey: "sellerName",
    key: "seller",
    label: "Seller",
    getValue: (row) =>
      `${row.sellerName || "Πωλητής"}${row.sellerCode ? ` • ${row.sellerCode}` : ""}`,
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

const bbmSalesStatusFilter: PowerBiTableFilter<BbmSalesRow> = {
  key: "closedMonthStatus",
  label: "Status",
  getValue: (row) => row.closedMonthStatus,
};

function getBbmSalesColumns(year: BbmSalesYear) {
  return year === 2025 ? bbmSales2025Columns : bbmSales2026Columns;
}

function getBbmSalesFilters(year: BbmSalesYear) {
  return year === 2025
    ? bbmSalesMainFilters
    : [...bbmSalesMainFilters, bbmSalesStatusFilter];
}

export function BbmSalesReportPage({ apiPath, year }: BbmSalesReportPageProps) {
  const { data, error, isLoading, isError, refetch } = useBbmSalesReport(
    apiPath,
    year,
  );
  const records = data?.records ?? [];
  const area = data?.area ?? "";

  return (
    <div className="app-page">
      <ReportHeader
        title={`BBM Sales ${year}`}
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-bar-chart-line"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError={`Failed to load BBM sales ${year}`}
        onRetry={() => void refetch()}
      >
        {records.length ? (
          <PowerBiTable
            tableId={`bbm-sales-${year}`}
            columns={getBbmSalesColumns(year)}
            exportFileName={`bbm-sales-${year}`}
            filters={getBbmSalesFilters(year)}
            getRowKey={(row, index) =>
              `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.group2}-${row.month}-${index}`
            }
            rows={records}
            title={`BBM Sales ${year} data`}
            subtitle={`Power BI Data for BBM Sales ${year}`}
          />
        ) : (
          <div className="app-card p-5 text-center text-muted-foreground">
            Δεν βρέθηκαν BBM στοιχεία για το area του login.
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
