import * as XLSX from "xlsx";

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
