import * as XLSX from "xlsx";

import {
  downloadXlsxWorkbook,
  getExportFileName,
  getMatrixExportFileName,
} from "@/features/powerBI/PowerBiTable/utils";
import {
  isRedundantGroup1Category,
} from "@/features/powerBI/reportMatrixData";
import { shouldHideMatrixParentMetrics } from "@/features/powerBI/reportMatrixVisibleRows";
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
  options?: {
    /** Seller-filter rows already sit under a Group2 header row. */
    omitGroup2?: boolean;
  },
) {
  const group2 = row.filterValues?.group2 ?? "";
  const category =
    row.filterValues?.category ?? nodeToExportString(row.category);
  const group3 = row.filterValues?.group3 ?? "";
  const parts: string[] = [];

  if (hasGroup2 && group2 && !options?.omitGroup2) {
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
  expandedGroup2Keys,
  group2Rows,
  group3Rows,
  group3RowsByCategory,
  hasGroup2,
  hasGroup3,
  sellerDetailRows,
  sellerFilterActive,
}: {
  categoryRows: ReportMatrixRow[];
  categoryRowsByGroup2: Map<string, ReportMatrixRow[]>;
  expandedGroup2Keys: ReadonlySet<string>;
  group2Rows: ReportMatrixRow[];
  group3Rows: ReportMatrixRow[];
  group3RowsByCategory: Map<string, ReportMatrixRow[]>;
  hasGroup2: boolean;
  hasGroup3: boolean;
  sellerDetailRows: ReportMatrixRow[];
  sellerFilterActive: boolean;
}) {
  if (!sellerFilterActive || !sellerDetailRows.length) {
    return [];
  }

  const withBreadcrumb = (row: ReportMatrixRow): ReportMatrixRow => ({
    ...row,
    category: buildMatrixHierarchyBreadcrumb(row, hasGroup2, {
      omitGroup2: true,
    }),
    isSellerFlattened: true,
  });

  const subcategoryCountByGroup2 = new Map<string, number>();

  if (hasGroup2) {
    for (const group2Row of group2Rows) {
      if (hasGroup3) {
        const group2 =
          group2Row.filterValues?.group2 ??
          nodeToExportString(group2Row.category);
        const count = sellerDetailRows.filter(
          (row) =>
            row.filterValues?.group2 === group2 &&
            Boolean(row.filterValues?.group3?.trim()),
        ).length;

        subcategoryCountByGroup2.set(group2Row.key, count);
      } else {
        subcategoryCountByGroup2.set(
          group2Row.key,
          (categoryRowsByGroup2.get(group2Row.key) ?? []).length,
        );
      }
    }
  }

  const appendSellerBranch = (
    target: Map<string, ReportMatrixRow[]>,
    group2Key: string,
    sellerRow: ReportMatrixRow,
  ) => {
    const existing = target.get(group2Key) ?? [];
    existing.push(withBreadcrumb(sellerRow));
    target.set(group2Key, existing);
  };

  const branchesByGroup2 = new Map<string, ReportMatrixRow[]>();
  const ungroupedBranches: ReportMatrixRow[] = [];

  if (hasGroup3) {
    const group2KeyByLabel = new Map(
      group2Rows.map((row) => [
        row.filterValues?.group2 ?? nodeToExportString(row.category),
        row.key,
      ]),
    );

    for (const sellerRow of sellerDetailRows) {
      const group3 = sellerRow.filterValues?.group3?.trim() ?? "";
      if (!group3) continue;

      if (hasGroup2) {
        const group2 = sellerRow.filterValues?.group2 ?? "";
        const group2Key = group2KeyByLabel.get(group2);
        if (!group2Key) continue;
        appendSellerBranch(branchesByGroup2, group2Key, sellerRow);
        continue;
      }

      ungroupedBranches.push(withBreadcrumb(sellerRow));
    }
  } else if (hasGroup2) {
    for (const group2Row of group2Rows) {
      for (const categoryRow of categoryRowsByGroup2.get(group2Row.key) ?? []) {
        appendSellerBranch(branchesByGroup2, group2Row.key, categoryRow);
      }
    }
  } else {
    for (const categoryRow of categoryRows) {
      ungroupedBranches.push(withBreadcrumb(categoryRow));
    }
  }

  if (hasGroup2) {
    return group2Rows.flatMap((group2Row) => {
      const branches = branchesByGroup2.get(group2Row.key) ?? [];
      if (!branches.length) return [];

      const subcategoryCount = subcategoryCountByGroup2.get(group2Row.key) ?? 0;
      const header: ReportMatrixRow = {
        ...group2Row,
        key: group2Row.key,
        category: nodeToExportString(group2Row.category),
        isSellerGroup2Summary: true,
        childCount: subcategoryCount,
      };

      if (subcategoryCount <= 1) {
        return [header];
      }

      if (!expandedGroup2Keys.has(group2Row.key)) {
        return [header];
      }

      return [header, ...branches];
    });
  }

  return ungroupedBranches;
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
  _options: {
    sellerFilterActive: boolean;
  },
) {
  if (shouldHideMatrixParentMetrics(row)) {
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
