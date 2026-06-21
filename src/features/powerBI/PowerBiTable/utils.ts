import * as XLSX from "xlsx";

import type { PowerBiTableColumn } from "@/features/powerBI/PowerBiTable/types";

export function normalizeFilterValue(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
) {
  if ((a == null || a === "") && (b == null || b === "")) return 0;
  if (a == null || a === "") return 1;
  if (b == null || b === "") return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), "el", {
    numeric: true,
    sensitivity: "base",
  });
}

function renderExportValue<T>(
  column: PowerBiTableColumn<T>,
  row: T,
  index: number,
) {
  const value = column.exportValue?.(row, index);
  if (value != null) return String(value);

  const rendered = column.render(row, index);
  return typeof rendered === "string" || typeof rendered === "number"
    ? String(rendered)
    : "";
}

export function buildExcelWorkbook<T>(
  columns: PowerBiTableColumn<T>[],
  rows: T[],
  sheetName = "Data",
) {
  const headers = columns.map((column) => column.header);
  const data = rows.map((row, rowIndex) =>
    columns.map((column) => renderExportValue(column, row, rowIndex)),
  );
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return workbook;
}

export function getExportFileName(title: string, exportFileName?: string) {
  const base = (exportFileName || title || "powerbi-data")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "powerbi-data"}.xlsx`;
}

export function downloadXlsxWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
) {
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
