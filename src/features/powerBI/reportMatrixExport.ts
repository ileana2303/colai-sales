import * as XLSX from "xlsx";

import {
  downloadXlsxWorkbook,
  getExportFileName,
  getMatrixExportFileName,
} from "@/features/powerBI/PowerBiTable/utils";
import {
  getDetailRowBranchParentKey,
  isRedundantGroup1Category,
} from "@/features/powerBI/reportMatrixData";
import type {
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixSection,
} from "@/features/powerBI/ReportMatrixTable";
import type { ReactNode } from "react";
import { Children, Fragment, isValidElement } from "react";

export function nodeToExportString(value: ReactNode): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(nodeToExportString).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(value)) {
    if (value.type === Fragment) {
      return Children.toArray(value.props.children)
        .map(nodeToExportString)
        .join("");
    }

    return nodeToExportString(value.props.children);
  }

  return "";
}

export function buildMatrixHierarchyBreadcrumb(
  row: ReportMatrixRow,
  hasGroup2: boolean,
) {
  const group2 = row.filterValues?.group2 ?? "";
  const category =
    row.filterValues?.category ?? nodeToExportString(row.category);
  const group3 = row.filterValues?.group3 ?? "";
  const parts: string[] = [];

  if (hasGroup2 && group2) {
    parts.push(group2);
  }

  if (
    category &&
    (!hasGroup2 || !isRedundantGroup1Category(group2, category))
  ) {
    parts.push(category);
  }

  if (group3) {
    parts.push(group3);
  }

  return parts.join(" › ");
}

export function buildSellerFilteredBodyRows({
  categoryRows,
  categoryRowsByGroup2,
  comparisonTeamRows,
  group2Rows,
  group3Rows,
  group3RowsByCategory,
  hasGroup2,
  hasGroup3,
  sellerDetailRows,
}: {
  categoryRows: ReportMatrixRow[];
  categoryRowsByGroup2: Map<string, ReportMatrixRow[]>;
  comparisonTeamRows: ReportMatrixRow[];
  group2Rows: ReportMatrixRow[];
  group3Rows: ReportMatrixRow[];
  group3RowsByCategory: Map<string, ReportMatrixRow[]>;
  hasGroup2: boolean;
  hasGroup3: boolean;
  sellerDetailRows: ReportMatrixRow[];
}) {
  const teamRowsByParentKey = new Map<string, ReportMatrixRow[]>();

  for (const teamRow of comparisonTeamRows) {
    const parentKey = teamRow.parentKey;
    if (!parentKey) continue;

    const existing = teamRowsByParentKey.get(parentKey) ?? [];
    existing.push(teamRow);
    teamRowsByParentKey.set(parentKey, existing);
  }

  const sellerTeamByParentKey = new Map<string, string>();

  for (const row of sellerDetailRows) {
    const parentKey = getDetailRowBranchParentKey(row, hasGroup3);
    const team = row.filterValues?.team ?? "";

    if (team && !sellerTeamByParentKey.has(parentKey)) {
      sellerTeamByParentKey.set(parentKey, team);
    }
  }

  const withBreadcrumb = (row: ReportMatrixRow): ReportMatrixRow => ({
    ...row,
    category: buildMatrixHierarchyBreadcrumb(row, hasGroup2),
    isSellerFlattened: true,
  });

  const toSellerBranchRows = (
    parentKey: string,
    sellerRow: ReportMatrixRow,
  ): ReportMatrixRow[] => {
    const breadcrumb = nodeToExportString(sellerRow.category);
    const sellerTeam = sellerTeamByParentKey.get(parentKey) ?? "";
    const teamRow = (teamRowsByParentKey.get(parentKey) ?? []).find(
      (row) => nodeToExportString(row.leadingValues?.team) === sellerTeam,
    );

    if (!teamRow) {
      return [sellerRow];
    }

    const teamName = nodeToExportString(teamRow.leadingValues?.team);

    return [
      {
        ...teamRow,
        category: teamName
          ? `${breadcrumb} › ${teamName}`
          : breadcrumb,
        isSellerTeamSummary: true,
      },
      sellerRow,
    ];
  };

  if (hasGroup3) {
    if (hasGroup2) {
      return group2Rows.flatMap((group2Row) => {
        const categories = categoryRowsByGroup2.get(group2Row.key) ?? [];

        return categories.flatMap((categoryRow) =>
          (group3RowsByCategory.get(categoryRow.key) ?? []).flatMap(
            (group3Row) =>
              toSellerBranchRows(group3Row.key, withBreadcrumb(group3Row)),
          ),
        );
      });
    }

    return group3Rows.flatMap((group3Row) =>
      toSellerBranchRows(group3Row.key, withBreadcrumb(group3Row)),
    );
  }

  if (hasGroup2) {
    return group2Rows.flatMap((group2Row) =>
      (categoryRowsByGroup2.get(group2Row.key) ?? []).flatMap((categoryRow) =>
        toSellerBranchRows(categoryRow.key, withBreadcrumb(categoryRow)),
      ),
    );
  }

  return categoryRows.flatMap((categoryRow) =>
    toSellerBranchRows(categoryRow.key, withBreadcrumb(categoryRow)),
  );
}

export function getLeadingExportValue(row: ReportMatrixRow, key: string) {
  if (key === "category") {
    const displayCategory = nodeToExportString(row.category);
    if (displayCategory) return displayCategory;

    return row.filterValues?.category ?? "";
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

export function getMatrixMetricDisplayValue(
  row: ReportMatrixRow,
  columnKey: string,
  options: {
    sellerFilterActive: boolean;
  },
) {
  if (
    options.sellerFilterActive &&
    !row.isTotal &&
    !row.isSellerFlattened &&
    !row.isSellerTeamSummary
  ) {
    return "";
  }

  return row.values[columnKey];
}

export function buildReportMatrixWorkbook({
  leadingColumns,
  rows,
  sections,
  sellerFilterActive = false,
}: {
  leadingColumns: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  sellerFilterActive?: boolean;
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
    ...metricColumns.map((column) =>
      nodeToExportString(
        getMatrixMetricDisplayValue(row, column.key, {
          sellerFilterActive,
        }),
      ),
    ),
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
  sellerFilterActive = false,
}: {
  brandLabel: string;
  exportFileName?: string;
  leadingColumns: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  sellerFilterActive?: boolean;
}) {
  downloadXlsxWorkbook(
    buildReportMatrixWorkbook({
      leadingColumns,
      rows,
      sections,
      sellerFilterActive,
    }),
    getExportFileName(brandLabel, exportFileName),
  );
}
