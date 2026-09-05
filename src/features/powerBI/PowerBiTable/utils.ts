import * as XLSX from "xlsx";

function sanitizeExportFileSegment(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/-matrix(?=-|$)/gi, "")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function getMatrixExportFileName(
  exportFileName?: string,
  brandLabel?: string,
  parts?: {
    category?: { label: string; value: string };
    seller?: { label: string; value: string };
  },
) {
  const base = exportFileName || brandLabel || "powerbi-data";
  const segments = [base];

  const categoryName = parts?.category?.value
    ? parts.category.label.trim() || parts.category.value
    : "";
  if (categoryName) segments.push(categoryName);

  if (parts?.seller?.value) {
    const sellerName =
      parts.seller.label.trim() ||
      parts.seller.value.split("|").slice(1).join("|").trim();
    if (sellerName) segments.push(sellerName);
  }

  return segments.join("-");
}

export function getExportFileName(title: string, exportFileName?: string) {
  const base = sanitizeExportFileSegment(exportFileName || title || "powerbi-data");

  return `${base || "powerbi-data"}.xlsx`;
}

export function getPdfExportFileName(title: string, exportFileName?: string) {
  return getExportFileName(title, exportFileName).replace(/\.xlsx$/i, ".pdf");
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
