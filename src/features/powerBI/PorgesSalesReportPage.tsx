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
import {
  usePorgesSalesReport,
} from "@/features/powerBI/hooks/usePowerBiReports";
import {
  PowerBiTable,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  MetricCard,
  ReportHeader,
  ValuePill,
} from "@/features/powerBI/ReportShared";
import type { PorgesSalesRow } from "@/lib/bi-reports/porges";
import {
  formatNullableCurrency,
  formatNullableInt,
  getMonthIndex,
  sumNullable,
} from "@/lib/bi-reports/reportUtils";
import { formatIntGR } from "@/lib/utils/number";

type PorgesSalesYear = 2025 | 2026;

type PorgesSalesReportPageProps = {
  apiPath:
    | "/api/powerbi/porges-sales-2025"
    | "/api/powerbi/porges-sales-2026";
  showAllDataTable?: boolean;
  year: PorgesSalesYear;
};

type AggregatedRow = {
  key: string;
  label: string;
  sales: number | null;
  target: number | null;
  records: number;
};

const porgesSalesColumns: PowerBiTableColumn<PorgesSalesRow>[] = [
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
    header: "PORGES Group",
    exportValue: (row) => row.group1,
    render: (row) => row.group1 || "-",
  },
  {
    key: "group2",
    header: "PORGES Sub",
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
  {
    key: "closedMonthStatus",
    header: "Status",
    exportValue: (row) => row.closedMonthStatus,
    render: (row) => row.closedMonthStatus || "-",
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
    key: "vcy",
    header: "VCY",
    align: "end",
    exportValue: (row) => row.vcy,
    render: (row) => formatNullableCurrency(row.vcy),
    sortValue: (row) => row.vcy,
  },
  {
    key: "tcy",
    header: "TCY",
    align: "end",
    exportValue: (row) => row.tcy,
    render: (row) => formatNullableCurrency(row.tcy),
    sortValue: (row) => row.tcy,
  },
];

const porgesSalesFilters: PowerBiTableFilter<PorgesSalesRow>[] = [
  {
    key: "group1",
    label: "PORGES Group",
    getValue: (row) => row.group1,
  },
  {
    key: "group2",
    label: "PORGES Sub",
    getValue: (row) => row.group2,
  },
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
    key: "closedMonthStatus",
    label: "Status",
    getValue: (row) => row.closedMonthStatus,
  },
];

function aggregateRows(
  rows: PorgesSalesRow[],
  getKey: (row: PorgesSalesRow) => string,
  getLabel: (row: PorgesSalesRow) => string,
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
        records: 0,
      } satisfies AggregatedRow);

    current.sales = (current.sales ?? 0) + (row.vcy ?? 0);
    current.target = (current.target ?? 0) + (row.tcy ?? 0);
    current.records += 1;
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort(
    (a, b) => (b.sales ?? 0) - (a.sales ?? 0),
  );
}

function countUnique(
  rows: PorgesSalesRow[],
  selector: (row: PorgesSalesRow) => string,
) {
  return new Set(rows.map((row) => selector(row).trim()).filter(Boolean)).size;
}

function FamilyBreakdown({ rows }: { rows: PorgesSalesRow[] }) {
  if (!rows.length) return null;

  const familyRows = aggregateRows(
    rows,
    (row) => row.group1,
    (row) => row.group1,
  );

  return (
    <section className="flex flex-col gap-2">
      <div className="app-card p-5">
        <div className="font-semibold">PORGES groups</div>
        <div className="text-sm text-muted-foreground mt-1">VCY σε σχέση με TCY</div>
      </div>

      {familyRows.map((row) => (
        <div key={row.key} className="app-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold truncate">{row.label}</div>
              <div className="text-sm text-muted-foreground">
                {formatIntGR(row.records)} γραμμές
              </div>
            </div>
          </div>

          <div className="app-metric-grid app-metric-grid--2 mt-3">
            <div>
              <ValuePill
                label="VCY"
                value={formatNullableCurrency(row.sales)}
              />
            </div>
            <div>
              <ValuePill
                label="TCY"
                value={formatNullableCurrency(row.target)}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function SellerTable({ rows }: { rows: PorgesSalesRow[] }) {
  if (!rows.length) return null;

  const sellerRows = aggregateRows(
    rows,
    (row) => row.sellerCode || row.sellerName,
    (row) =>
      `${row.sellerName || "Πωλητής"}${row.sellerCode ? ` • ${row.sellerCode}` : ""}`,
  );

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Πωλητές</div>
          <div className="text-sm text-muted-foreground">
            Σύνολα ανά πωλητή για το logged-in area
          </div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Πωλητής</TableHead>
              <TableHead className="text-right">VCY</TableHead>
              <TableHead className="text-right">TCY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellerRows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-semibold">{row.label}</TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.sales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNullableCurrency(row.target)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MonthRows({ rows }: { rows: PorgesSalesRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικές γραμμές</div>
          <div className="text-sm text-muted-foreground">
            Month, status και PORGES group από Power BI
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs text-foreground">
          {formatIntGR(rows.length)}
        </span>
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μήνας / Group</TableHead>
              <TableHead>Πωλητής / Status</TableHead>
              <TableHead className="text-right">VCY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 80).map((row, index) => (
              <TableRow
                key={`${row.sellerCode}-${row.group1}-${row.month}-${index}`}
              >
                <TableCell className="font-semibold">
                  {row.month || "-"} • {row.group1 || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.sellerName || "Πωλητής"}
                  {row.closedMonthStatus ? ` • ${row.closedMonthStatus}` : ""}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNullableCurrency(row.vcy)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function PorgesSalesReportPage({
  apiPath,
  showAllDataTable = false,
  year,
}: PorgesSalesReportPageProps) {
  const { data, error, isLoading, isError, refetch } = usePorgesSalesReport(
    apiPath,
    year,
  );
  const records = data?.records ?? [];
  const area = data?.area ?? "";

  const totalSales = sumNullable(records, (row) => row.vcy);
  const totalTarget = sumNullable(records, (row) => row.tcy);
  const sellerCount = countUnique(records, (row) => row.sellerCode);
  const familyCount = countUnique(records, (row) => row.group1);
  const monthCount = countUnique(records, (row) => row.month);

  return (
    <div className="app-page">
      <ReportHeader
        title={`Porges Sales ${year}`}
        subtitle={area ? `Area: ${area}` : "Area από το login"}
        icon="bi-graph-up-arrow"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError={`Failed to load Porges sales ${year}`}
        onRetry={() => void refetch()}
      >
        {records.length ? (
        <>
          {showAllDataTable ? (
            <PowerBiTable
              tableId={`porges-sales-${year}`}
              columns={porgesSalesColumns}
              exportFileName={`porges-sales-${year}`}
              filters={porgesSalesFilters}
              getRowKey={(row, index) =>
                `${row.area}-${row.team}-${row.sellerCode}-${row.group1}-${row.month}-${index}`
              }
              rows={records}
              title={`Porges Sales ${year} data`}
              subtitle={`Power BI Data for Porges Sales ${year}`}
            />
          ) : null}

          <section className="app-metric-grid">
            <MetricCard
              label="VCY"
              value={formatNullableCurrency(totalSales)}
              icon="bi-cash-stack"
              accent="#2563eb"
            />
            <MetricCard
              label="TCY"
              value={formatNullableCurrency(totalTarget)}
              icon="bi-bullseye"
              accent="#16a34a"
            />
            <MetricCard
              label="Πωλητές"
              value={formatIntGR(sellerCount)}
              icon="bi-people"
              accent="#f97316"
            />
          </section>

          <section className="app-metric-grid">
            <div>
              <ValuePill
                label="PORGES groups"
                value={formatIntGR(familyCount)}
              />
            </div>
            <div>
              <ValuePill label="Μήνες" value={formatIntGR(monthCount)} />
            </div>
          </section>

          <FamilyBreakdown rows={records} />
          <SellerTable rows={records} />
          <MonthRows rows={records} />
        </>
        ) : (
        <div className="app-card p-5 text-center text-muted-foreground">
          Δεν βρέθηκαν Porges στοιχεία για το area του login.
        </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
