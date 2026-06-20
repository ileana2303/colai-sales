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

function escapeExcelCell(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildExcelHtml<T>(
  columns: PowerBiTableColumn<T>[],
  rows: T[],
) {
  const headerCells = columns
    .map((column) => `<th>${escapeExcelCell(column.header)}</th>`)
    .join("");
  const bodyRows = rows
    .map((row, rowIndex) => {
      const cells = columns
        .map(
          (column) =>
            `<td>${escapeExcelCell(renderExportValue(column, row, rowIndex))}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

export function getExportFileName(title: string, exportFileName?: string) {
  const base = (exportFileName || title || "powerbi-data")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "powerbi-data"}.xls`;
}

export function downloadExcelFile(html: string, fileName: string) {
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
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
