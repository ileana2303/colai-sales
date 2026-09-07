import type { jsPDF } from "jspdf";
import autoTable, { type CellDef, type RowInput } from "jspdf-autotable";

import { getPdfExportFileName } from "@/features/powerBI/PowerBiTable/utils";
import {
  getLeadingExportValue,
  getMatrixMetricDisplayValue,
  nodeToExportString,
} from "@/features/powerBI/reportMatrixExport";
import type {
  ReportMatrixPdfExportOptions,
  ReportMatrixPdfFilters,
  ReportMatrixPdfPage,
} from "@/features/powerBI/types/reportMatrixPdfExport.types";
import type {
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixSection,
  ReportMatrixTone,
} from "@/features/powerBI/types/ReportMatrixTable.types";

const PDF_FONT_NAME = "NotoSans";
const PDF_FONT_REGULAR = "NotoSans-Regular.ttf";
const PDF_FONT_BOLD = "NotoSans-Bold.ttf";

const fontCache = new Map<string, string>();

const TABLE_BORDER_COLOR = [100, 116, 139] as [number, number, number];
const TABLE_ROW_BORDER_WIDTH = 0.25;
const TABLE_SECTION_BORDER_WIDTH = 0.6;
const PDF_BODY_FONT_SIZE = 7;
const PDF_TOTAL_FONT_SIZE = 9;
const PDF_TOTAL_FILL_COLOR = [241, 245, 249] as [number, number, number];
const PDF_SELLER_FILTER_ROW_FILL_COLOR = [255, 255, 255] as [
  number,
  number,
  number,
];
const PDF_GROUP2_FILL_COLOR = [187, 247, 208] as [number, number, number];
const PDF_GROUP2_TEXT_COLOR = [5, 46, 22] as [number, number, number];
const PDF_TEAM_SUMMARY_FILL_COLOR = [219, 234, 254] as [number, number, number];
const PDF_SELLER_GROUP2_CATEGORY_PADDING_LEFT = 2;
const PDF_SELLER_FLAT_CATEGORY_PADDING_LEFT = 7;

type SellerFilterRowLevel = "group2" | "seller" | "team";

function getSellerFilterRowLevel(
  row: ReportMatrixRow,
): SellerFilterRowLevel | null {
  if (row.isSellerGroup2Summary) return "group2";
  if (row.isSellerTeamSummary) return "team";
  if (row.isSellerFlattened) return "seller";
  return null;
}

function getPdfSellerCategoryPaddingLeft(level: SellerFilterRowLevel | null) {
  switch (level) {
    case "group2":
      return PDF_SELLER_GROUP2_CATEGORY_PADDING_LEFT;
    case "team":
    case "seller":
      return PDF_SELLER_FLAT_CATEGORY_PADDING_LEFT;
    default:
      return 0;
  }
}

function withPdfCellPaddingLeft(
  styles: Record<string, unknown>,
  paddingLeft = 0,
) {
  if (paddingLeft <= 0) {
    return styles;
  }

  return {
    ...styles,
    cellPadding: {
      top: 1.8,
      right: 1.8,
      bottom: 1.8,
      left: paddingLeft,
    },
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

async function fetchFontBase64(path: string) {
  const cached = fontCache.get(path);
  if (cached) return cached;

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${path}`);
  }

  const base64 = arrayBufferToBase64(await response.arrayBuffer());
  fontCache.set(path, base64);
  return base64;
}

async function registerPdfFonts(doc: jsPDF) {
  const [regular, bold] = await Promise.all([
    fetchFontBase64("/fonts/NotoSans-Regular.ttf"),
    fetchFontBase64("/fonts/NotoSans-Bold.ttf"),
  ]);

  doc.addFileToVFS(PDF_FONT_REGULAR, regular);
  doc.addFileToVFS(PDF_FONT_BOLD, bold);
  doc.addFont(PDF_FONT_REGULAR, PDF_FONT_NAME, "normal");
  doc.addFont(PDF_FONT_BOLD, PDF_FONT_NAME, "bold");
}

function getSectionFillColor(tone?: ReportMatrixTone) {
  switch (tone) {
    case "success":
      return [220, 252, 231] as [number, number, number];
    case "rose":
    case "warning":
      return [252, 231, 243] as [number, number, number];
    case "primary":
      return [219, 234, 254] as [number, number, number];
    default:
      return [241, 245, 249] as [number, number, number];
  }
}

function getToneTextColor(tone?: ReportMatrixTone) {
  switch (tone) {
    case "danger":
      return [220, 38, 38] as [number, number, number];
    case "success":
      return [21, 128, 61] as [number, number, number];
    case "warning":
    case "rose":
      return [190, 18, 60] as [number, number, number];
    case "muted":
      return [100, 116, 139] as [number, number, number];
    default:
      return [15, 23, 42] as [number, number, number];
  }
}

function getRowFillColor(
  row: ReportMatrixRow,
  group2Keys: Set<string>,
  sellerFilterActive = false,
) {
  if (row.isTotal) {
    return PDF_TOTAL_FILL_COLOR;
  }

  if (sellerFilterActive) {
    if (row.isSellerGroup2Summary) {
      return PDF_GROUP2_FILL_COLOR;
    }

    if (row.isSellerTeamSummary) {
      return PDF_TEAM_SUMMARY_FILL_COLOR;
    }

    return PDF_SELLER_FILTER_ROW_FILL_COLOR;
  }

  if (row.rowKind === "group2") {
    return PDF_GROUP2_FILL_COLOR;
  }

  if (row.rowKind === "category") {
    if (row.parentKey && group2Keys.has(row.parentKey)) {
      return PDF_SELLER_FILTER_ROW_FILL_COLOR;
    }

    return [219, 234, 254] as [number, number, number];
  }

  return undefined;
}

function getRowTextColor(row: ReportMatrixRow) {
  if (row.rowKind === "group2" || row.isSellerGroup2Summary) {
    return PDF_GROUP2_TEXT_COLOR;
  }

  if (row.rowKind === "category") {
    return [30, 58, 95] as [number, number, number];
  }

  return [15, 23, 42] as [number, number, number];
}

function isGroup2SubcategoryRow(
  row: ReportMatrixRow,
  group2Keys: Set<string | undefined>,
) {
  return (
    row.rowKind === "category" &&
    Boolean(row.parentKey) &&
    group2Keys.has(row.parentKey)
  );
}

function getPdfRowFontStyle(
  row: ReportMatrixRow,
  group2Keys: Set<string>,
): "bold" | "normal" {
  if (row.isTotal) return "bold";
  if (row.rowKind === "group2" || row.isSellerGroup2Summary) return "bold";
  if (isGroup2SubcategoryRow(row, group2Keys) || row.isSellerFlattened) {
    return "normal";
  }
  if (row.rowKind === "category" || row.isSellerTeamSummary) {
    return "bold";
  }
  return "normal";
}

function getColumnHalign(align?: "center" | "left" | "right") {
  if (align === "center") return "center";
  if (align === "left") return "left";
  return "right";
}

type PdfMetricColumn = ReportMatrixSection["columns"][number] & {
  isLastSection: boolean;
  isSectionBoundary: boolean;
  isSectionEnd: boolean;
  isSectionStart: boolean;
};

function flattenPdfMetricColumns(sections: ReportMatrixSection[]) {
  return sections.flatMap((section, sectionIndex) =>
    section.columns.map((column, columnIndex) => ({
      ...column,
      isLastSection: sectionIndex === sections.length - 1,
      isSectionStart: columnIndex === 0,
      isSectionEnd: columnIndex === section.columns.length - 1,
      isSectionBoundary: sectionIndex > 0 && columnIndex === 0,
    })),
  );
}

function applyMatrixCellBorder<T extends Record<string, unknown>>(
  styles: T,
  edges: {
    isLastSection?: boolean;
    isSectionEnd?: boolean;
    isSectionStart?: boolean;
  },
) {
  const lineWidth: Record<string, number> = {
    top: 0,
    right: 0,
    bottom: TABLE_ROW_BORDER_WIDTH,
    left: 0,
  };

  if (edges.isSectionStart) {
    lineWidth.left = TABLE_SECTION_BORDER_WIDTH;
  }

  if (edges.isSectionEnd && !edges.isLastSection) {
    lineWidth.right = TABLE_SECTION_BORDER_WIDTH;
  }

  return {
    ...styles,
    lineWidth,
    lineColor: TABLE_BORDER_COLOR,
  };
}

function withBottomBorder<T extends Record<string, unknown>>(styles: T) {
  return applyMatrixCellBorder(styles, {});
}

function buildPdfTableHead(
  leadingColumns: ReportMatrixLeadingColumn[],
  sections: ReportMatrixSection[],
) {
  const sectionRow: CellDef[] = [
    ...leadingColumns.map((column) => ({
      content: nodeToExportString(column.label),
      rowSpan: 2,
      styles: withBottomBorder({
        fillColor: [241, 245, 249] as [number, number, number],
        textColor: [31, 78, 128] as [number, number, number],
        fontStyle: "bold" as const,
      }),
    })),
    ...sections.map((section, sectionIndex) => ({
      content: nodeToExportString(section.title),
      colSpan: section.columns.length,
      styles: applyMatrixCellBorder(
        {
          fillColor: getSectionFillColor(section.tone),
          textColor: [31, 78, 128] as [number, number, number],
          fontStyle: "bold" as const,
          halign: "center" as const,
        },
        {
          isSectionStart: true,
          isSectionEnd: true,
          isLastSection: sectionIndex === sections.length - 1,
        },
      ),
    })),
  ];

  const columnRow: CellDef[] = [
    ...flattenPdfMetricColumns(sections).map((column) => ({
      content: nodeToExportString(column.label),
      styles: applyMatrixCellBorder(
        {
          fillColor: [241, 245, 249] as [number, number, number],
          textColor: [31, 78, 128] as [number, number, number],
          fontStyle: "bold" as const,
        },
        {
          isSectionStart: column.isSectionStart,
          isSectionEnd: column.isSectionEnd,
          isLastSection: column.isLastSection,
        },
      ),
    })),
  ];

  return [sectionRow, columnRow];
}

function buildPdfTableBody(
  rows: ReportMatrixRow[],
  leadingColumns: ReportMatrixLeadingColumn[],
  metricColumns: PdfMetricColumn[],
  group2Keys: Set<string>,
  metricDisplayOptions: {
    sellerFilterActive: boolean;
  },
) {
  const getMetricValue = (row: ReportMatrixRow, columnKey: string) =>
    nodeToExportString(
      getMatrixMetricDisplayValue(row, columnKey, metricDisplayOptions),
    );

  return rows.map((row) => {
    const rowFill = getRowFillColor(
      row,
      group2Keys,
      metricDisplayOptions.sellerFilterActive,
    );
    const rowFontStyle = getPdfRowFontStyle(row, group2Keys);
    const rowFontSize = row.isTotal ? PDF_TOTAL_FONT_SIZE : PDF_BODY_FONT_SIZE;
    const defaultTextColor = getRowTextColor(row);
    const sellerLevel = metricDisplayOptions.sellerFilterActive
      ? getSellerFilterRowLevel(row)
      : null;

    if (row.rowKind === "group2" && !row.isSellerGroup2Summary) {
      return [
        {
          content: getLeadingExportValue(row, "category"),
          colSpan: leadingColumns.length,
          styles: withBottomBorder({
            fillColor: rowFill,
            textColor: defaultTextColor,
            fontStyle: rowFontStyle,
          }),
        },
        ...metricColumns.map((column) => {
          const metricValue = getMetricValue(row, column.key);

          return {
            content: metricValue,
            styles: applyMatrixCellBorder(
              {
                fillColor: rowFill,
                fontSize: rowFontSize,
                fontStyle: rowFontStyle,
                textColor: metricValue
                  ? getToneTextColor(
                      row.cellTones?.[column.key] ?? column.cellTone,
                    )
                  : defaultTextColor,
                halign: getColumnHalign(column.align),
              },
              {
                isSectionStart: column.isSectionStart,
                isSectionEnd: column.isSectionEnd,
                isLastSection: column.isLastSection,
              },
            ),
          };
        }),
      ] as RowInput;
    }

    const leadingCells = leadingColumns.map((column) => ({
      content: getLeadingExportValue(row, column.key),
      styles: withPdfCellPaddingLeft(
        withBottomBorder({
          fillColor: rowFill,
          fontSize: rowFontSize,
          fontStyle: rowFontStyle,
          textColor: defaultTextColor,
        }),
        column.key === "category"
          ? getPdfSellerCategoryPaddingLeft(sellerLevel)
          : 0,
      ),
    }));

    const metricCells = metricColumns.map((column) => {
      const metricValue = getMetricValue(row, column.key);

      return {
        content: metricValue,
        styles: applyMatrixCellBorder(
          {
            fillColor: rowFill,
            fontSize: rowFontSize,
            fontStyle: rowFontStyle,
            textColor: metricValue
              ? getToneTextColor(row.cellTones?.[column.key] ?? column.cellTone)
              : defaultTextColor,
            halign: row.isSellerGroup2Summary
              ? "center"
              : getColumnHalign(column.align),
          },
          {
            isSectionStart: column.isSectionStart,
            isSectionEnd: column.isSectionEnd,
            isLastSection: column.isLastSection,
          },
        ),
      };
    });

    return [...leadingCells, ...metricCells] as RowInput;
  });
}

function formatPdfCategoryFilterValue(
  filters: ReportMatrixPdfFilters,
  sellerFilterActive: boolean,
) {
  if (sellerFilterActive && filters.group2) {
    return `${filters.group2} -> ${filters.category}`;
  }

  return filters.category;
}

function writeMetadataSection(
  doc: jsPDF,
  options: ReportMatrixPdfExportOptions,
  page: ReportMatrixPdfPage,
  startY: number,
) {
  const {
    brandLabel,
    categoryLabel = "Κατηγορία Στόχου",
    description,
    periodSummary = [],
  } = options;
  const { filters, sellerFilterActive = false } = page;
  let y = startY;

  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(16);
  doc.text(brandLabel, 14, y);
  y += 10;

  if (periodSummary.length) {
    autoTable(doc, {
      startY: y,
      theme: "plain",
      styles: {
        font: PDF_FONT_NAME,
        fontSize: 8,
        cellPadding: 2.5,
      },
      body: [
        periodSummary.map((item) => ({
          content: [item.label, item.value, item.hint ? `(${item.hint})` : ""]
            .filter(Boolean)
            .join("\n"),
          styles: {
            fillColor: [239, 246, 255],
            textColor: [30, 64, 175],
            fontStyle: "bold",
          },
        })),
      ],
      margin: { left: 14, right: 14 },
    });

    y =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 6;
  }

  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(9);
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: 9,
      cellPadding: 3,
    },
    body: [
      [
        {
          content: `AREA: ${filters.area}`,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [30, 58, 95],
            fontStyle: "bold",
          },
        },
        {
          content: `${categoryLabel}: ${formatPdfCategoryFilterValue(
            filters,
            sellerFilterActive,
          )}`,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [30, 58, 95],
            fontStyle: "bold",
          },
        },
        {
          content: `TEAM: ${filters.team}`,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [30, 58, 95],
            fontStyle: "bold",
          },
        },
        {
          content: `Seller name: ${filters.seller}`,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [30, 58, 95],
            fontStyle: "bold",
          },
        },
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;

  if (description) {
    doc.setFont(PDF_FONT_NAME, "bold");
    doc.text(description, 14, y, {
      maxWidth: doc.internal.pageSize.getWidth() - 28,
    });
    y += 8;
  }

  return y + 2;
}

function writePdfMatrixTable(
  doc: jsPDF,
  options: ReportMatrixPdfExportOptions,
  page: ReportMatrixPdfPage,
  startY: number,
) {
  const { leadingColumns, sections } = options;
  const { rows, sellerFilterActive = false } = page;
  const metricColumns = flattenPdfMetricColumns(sections);
  const group2Keys = new Set(
    rows.filter((row) => row.rowKind === "group2").map((row) => row.key),
  );

  autoTable(doc, {
    startY,
    head: buildPdfTableHead(leadingColumns, sections),
    body: buildPdfTableBody(rows, leadingColumns, metricColumns, group2Keys, {
      sellerFilterActive,
    }),
    theme: "plain",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: PDF_BODY_FONT_SIZE,
      cellPadding: 1.8,
      overflow: "linebreak",
      valign: "middle",
      lineWidth: {
        top: 0,
        right: 0,
        bottom: TABLE_ROW_BORDER_WIDTH,
        left: 0,
      },
      lineColor: TABLE_BORDER_COLOR,
    },
    headStyles: {
      font: PDF_FONT_NAME,
      fontStyle: "bold",
      lineColor: TABLE_BORDER_COLOR,
    },
    margin: { top: 12, left: 10, right: 10, bottom: 12 },
    rowPageBreak: "avoid",
  });
}

export async function exportReportMatrixToPdf(
  options: ReportMatrixPdfExportOptions,
) {
  const { brandLabel, exportFileName, pages } = options;
  if (!pages.length) return;

  const doc = new (await import("jspdf")).jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  await registerPdfFonts(doc);
  doc.setFont(PDF_FONT_NAME, "normal");

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const tableStartY = writeMetadataSection(doc, options, page, 14);
    writePdfMatrixTable(doc, options, page, tableStartY);
  });

  doc.save(getPdfExportFileName(brandLabel, exportFileName));
}
