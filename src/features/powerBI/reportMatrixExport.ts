import * as XLSX from "xlsx";

import {
  downloadXlsxWorkbook,
  getExportFileName,
} from "@/features/powerBI/PowerBiTable/utils";
import type {
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixSection,
} from "@/features/powerBI/ReportMatrixTable";
import type { ReactNode } from "react";

function nodeToExportString(value: ReactNode) {
  if (value == null || value === "" || value === "-") return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
}

function getLeadingExportValue(row: ReportMatrixRow, key: string) {
  if (key === "category") {
    return row.filterValues?.category ?? nodeToExportString(row.category);
  }

  if (key === "team") {
    return row.filterValues?.team ?? nodeToExportString(row.leadingValues?.team);
  }

  if (key === "seller") {
    return (
      row.filterValues?.sellerLabel ??
      nodeToExportString(row.leadingValues?.seller)
    );
  }

  return nodeToExportString(row.leadingValues?.[key]);
}

export function buildReportMatrixWorkbook({
  leadingColumns,
  rows,
  sections,
}: {
  leadingColumns: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
}) {
  const metricColumns = sections.flatMap((section) => section.columns);
  const headers = [
    ...leadingColumns.map((column) =>
      typeof column.label === "string" ? column.label : String(column.key),
    ),
    ...metricColumns.map((column) =>
      typeof column.label === "string" ? column.label : String(column.key),
    ),
  ];

  const sheetRows = rows.map((row) => [
    ...leadingColumns.map((column) => getLeadingExportValue(row, column.key)),
    ...metricColumns.map((column) => nodeToExportString(row.values[column.key])),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetRows]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Matrix");

  return workbook;
}

export function exportReportMatrixToExcel({
  brandLabel,
  exportFileName,
  leadingColumns,
  rows,
  sections,
}: {
  brandLabel: string;
  exportFileName?: string;
  leadingColumns: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
}) {
  downloadXlsxWorkbook(
    buildReportMatrixWorkbook({ leadingColumns, rows, sections }),
    getExportFileName(brandLabel, exportFileName),
  );
}
