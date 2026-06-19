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
import type { BbmSalesRow } from "@/lib/bi-reports/bbm";
import {
  formatNullableCurrency,
  formatNullableInt,
  getMonthIndex,
} from "@/lib/bi-reports/reportUtils";

type BbmSalesYear = 2025 | 2026;

type BbmSalesResponse = {
  ok: true;
  report: "bbm_sales_2025" | "bbm_sales_2026";
  year: BbmSalesYear;
  area: string;
  records: BbmSalesRow[];
};

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
      <span className="d-inline-flex align-items-baseline gap-1">
        <span>{row.sellerName || "-"}</span>
        {row.sellerCode ? (
          <span className="small text-secondary">{row.sellerCode}</span>
        ) : null}
      </span>
    ),
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
    key: "month",
    header: "Month",
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

const bbmSales2025Columns: PowerBiTableColumn<BbmSalesRow>[] = [
  ...bbmSalesMainColumns,
  ...bbmSalesReportColumns,
  bbmSalesVcyColumn,
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
    label: "Group1",
    getValue: (row) => row.group1,
  },
  {
    key: "group2",
    label: "Group2",
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
  const [records, setRecords] = React.useState<BbmSalesRow[]>([]);
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
      const data = await parseProxyJson<BbmSalesResponse>(
        res,
        `Failed to load BBM sales ${year}`,
      );

      setRecords(data.records ?? []);
      setArea(data.area ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to load BBM sales ${year}`,
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

  return (
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title={`BBM Sales ${year}`}
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-bar-chart-line"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadReport()} />
      ) : records.length ? (
        <PowerBiTable
          columns={getBbmSalesColumns(year)}
          exportFileName={`bbm-sales-${year}`}
          filters={getBbmSalesFilters(year)}
          getRowKey={(row, index) =>
            `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.group2}-${row.month}-${index}`
          }
          rows={records}
          title={`BBM Sales ${year} data`}
          subtitle={`Power BI Data for BBM Sales ${year}`}
          maxHeight={720}
        />
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν BBM στοιχεία για το area του login.
        </div>
      )}
    </div>
  );
}
