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
  comparisonGroup2Rows,
  comparisonTeamRows,
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
  comparisonGroup2Rows: ReportMatrixRow[];
  comparisonTeamRows: ReportMatrixRow[];
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

  const subcategoryCountByGroup2 = new Map<string, number>();

  if (hasGroup2) {
    for (const group2Row of group2Rows) {
      if (hasGroup3) {
        let count = 0;

        for (const categoryRow of categoryRowsByGroup2.get(group2Row.key) ?? []) {
          count += (group3RowsByCategory.get(categoryRow.key) ?? []).length;
        }

        subcategoryCountByGroup2.set(group2Row.key, count);
      } else {
        subcategoryCountByGroup2.set(
          group2Row.key,
          (categoryRowsByGroup2.get(group2Row.key) ?? []).length,
        );
      }
    }
  }

  const ungroupedSubcategoryCount = hasGroup3
    ? group3Rows.length
    : categoryRows.length;

  const buildSellerBranchContent = (
    parentKey: string,
    sellerRow: ReportMatrixRow,
    subcategoryCount: number,
  ): ReportMatrixRow[] => {
    const breadcrumb = nodeToExportString(sellerRow.category);
    const rows: ReportMatrixRow[] = [];
    const sellerTeam = sellerTeamByParentKey.get(parentKey) ?? "";
    const teamRow = (teamRowsByParentKey.get(parentKey) ?? []).find(
      (row) => nodeToExportString(row.leadingValues?.team) === sellerTeam,
    );

    if (sellerFilterActive && teamRow && subcategoryCount > 1) {
      rows.push({
        ...teamRow,
        key: `${teamRow.key}|seller-team-summary|${parentKey}`,
        category: breadcrumb,
        isSellerTeamSummary: true,
      });
    }

    rows.push(sellerRow);
    return rows;
  };

  const appendSellerBranches = (
    target: Map<string, ReportMatrixRow[]>,
    group2Key: string,
    parentKey: string,
    sellerRow: ReportMatrixRow,
  ) => {
    const subcategoryCount = subcategoryCountByGroup2.get(group2Key) ?? 1;
    const existing = target.get(group2Key) ?? [];
    existing.push(
      ...buildSellerBranchContent(parentKey, sellerRow, subcategoryCount),
    );
    target.set(group2Key, existing);
  };

  const branchesByGroup2 = new Map<string, ReportMatrixRow[]>();
  const ungroupedBranches: ReportMatrixRow[] = [];

  if (hasGroup3) {
    if (hasGroup2) {
      for (const group2Row of group2Rows) {
        const categories = categoryRowsByGroup2.get(group2Row.key) ?? [];

        for (const categoryRow of categories) {
          for (const group3Row of group3RowsByCategory.get(categoryRow.key) ??
            []) {
            appendSellerBranches(
              branchesByGroup2,
              group2Row.key,
              group3Row.key,
              withBreadcrumb(group3Row),
            );
          }
        }
      }
    } else {
      for (const group3Row of group3Rows) {
        ungroupedBranches.push(
          ...buildSellerBranchContent(
            group3Row.key,
            withBreadcrumb(group3Row),
            ungroupedSubcategoryCount,
          ),
        );
      }
    }
  } else if (hasGroup2) {
    for (const group2Row of group2Rows) {
      for (const categoryRow of categoryRowsByGroup2.get(group2Row.key) ?? []) {
        appendSellerBranches(
          branchesByGroup2,
          group2Row.key,
          categoryRow.key,
          withBreadcrumb(categoryRow),
        );
      }
    }
  } else {
    for (const categoryRow of categoryRows) {
      ungroupedBranches.push(
        ...buildSellerBranchContent(
          categoryRow.key,
          withBreadcrumb(categoryRow),
          ungroupedSubcategoryCount,
        ),
      );
    }
  }

  if (hasGroup2) {
    return comparisonGroup2Rows.flatMap((group2Row) => {
      const branches = branchesByGroup2.get(group2Row.key) ?? [];
      if (!branches.length) return [];

      const header: ReportMatrixRow = {
        ...group2Row,
        key: group2Row.key,
        category: nodeToExportString(group2Row.category),
        isSellerGroup2Summary: true,
        childCount: branches.length,
      };

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
  options: {
    sellerFilterActive: boolean;
  },
) {
  if (
    options.sellerFilterActive &&
    !row.isTotal &&
    !row.isSellerFlattened &&
    !row.isSellerTeamSummary &&
    !row.isSellerGroup2Summary
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
