import {
  buildReportMatrixCategoryRows,
  buildReportMatrixGroup2Rows,
  buildReportMatrixGroup3Rows,
  buildReportMatrixTeamRows,
  buildReportMatrixTotalRows,
  isRedundantGroup1Category,
  reportMatrixDetailRowsHaveGroup2,
  reportMatrixDetailRowsHaveGroup3,
} from "@/features/powerBI/reportMatrixData";
import type { ReportMatrixRow } from "@/features/powerBI/types/ReportMatrixTable.types";

const EMPTY_EXPANSION_KEYS: ReadonlySet<string> = new Set();

export type ReportMatrixExpansionState = {
  categoryKeys: ReadonlySet<string>;
  group2Keys: ReadonlySet<string>;
  group3Keys: ReadonlySet<string>;
  teamKeys: ReadonlySet<string>;
};

export type ReportMatrixExportMember = {
  seller: string;
  sellerLabel: string;
  team: string;
};

export type ReportMatrixFilteredView = {
  bodyRows: ReportMatrixRow[];
  filteredDetailRows: ReportMatrixRow[];
  filteredRows: ReportMatrixRow[];
  group2Rows: ReportMatrixRow[];
  hasGroup2: boolean;
  hasGroup3: boolean;
  totalRows: ReportMatrixRow[];
};

export function shouldShowCategoryTier(
  row: ReportMatrixRow,
  hasGroup3: boolean,
) {
  if (!hasGroup3 || row.rowKind !== "category") return false;
  return (row.childCount ?? 0) > 0;
}

export function canExpandCategory(
  row: ReportMatrixRow,
  hasGroup3 = false,
) {
  if (!shouldShowCategoryTier(row, hasGroup3)) return false;
  return (row.childCount ?? 0) > 1;
}

export function canExpandGroup2(row: ReportMatrixRow) {
  return row.rowKind === "group2" && (row.childCount ?? 0) > 1;
}

export function canExpandGroup3(_row: ReportMatrixRow) {
  return false;
}

export function canExpandTeam(_row: ReportMatrixRow) {
  return false;
}

export function shouldHideMatrixParentMetrics(
  row: ReportMatrixRow,
  hasGroup3: boolean,
) {
  if (row.isTotal) return false;

  return (
    shouldShowCategoryTier(row, hasGroup3) && (row.childCount ?? 0) === 1
  );
}

export function getReportMatrixCategoryValue(row: ReportMatrixRow) {
  return row.filterValues?.category ?? String(row.category ?? "");
}

export function getReportMatrixTeamValue(row: ReportMatrixRow) {
  return row.filterValues?.team ?? String(row.leadingValues?.team ?? "");
}

function groupRowsByParentKey(rows: ReportMatrixRow[]) {
  const groupedRows = new Map<string, ReportMatrixRow[]>();

  for (const row of rows) {
    const parentKey = row.parentKey;
    if (!parentKey) continue;

    const existing = groupedRows.get(parentKey);
    if (existing) {
      existing.push(row);
    } else {
      groupedRows.set(parentKey, [row]);
    }
  }

  return groupedRows;
}

function resolveExpansionKeys(
  rows: ReportMatrixRow[],
  current: ReadonlySet<string> | undefined,
  expandAll: boolean,
) {
  if (expandAll) {
    return new Set(rows.map((row) => row.key));
  }

  return current ?? EMPTY_EXPANSION_KEYS;
}

function filterReportMatrixDetailRows(
  rows: ReportMatrixRow[],
  categoryFilter: string,
  teamFilter: string,
  sellerFilter: string,
) {
  return rows.filter((row) => {
    const categoryValue = getReportMatrixCategoryValue(row);
    const teamValue = getReportMatrixTeamValue(row);
    const sellerValue = row.filterValues?.seller ?? "";

    if (categoryFilter && categoryValue !== categoryFilter) {
      return false;
    }
    if (teamFilter && teamValue !== teamFilter) {
      return false;
    }
    if (sellerFilter && sellerValue !== sellerFilter) {
      return false;
    }
    return true;
  });
}

function buildComparisonDetailRows({
  categoryFilter,
  detailRows,
  filteredDetailRows,
  sellerFilter,
  teamFilter,
}: {
  categoryFilter: string;
  detailRows: ReportMatrixRow[];
  filteredDetailRows: ReportMatrixRow[];
  sellerFilter: string;
  teamFilter: string;
}) {
  const selectedSellerTeams =
    sellerFilter && !teamFilter
      ? new Set(
          detailRows
            .filter((row) => row.filterValues?.seller === sellerFilter)
            .map((row) => row.filterValues?.team ?? "")
            .filter(Boolean),
        )
      : new Set<string>();

  const visibleCategories = sellerFilter
    ? new Set(
        filteredDetailRows.map((row) => getReportMatrixCategoryValue(row)),
      )
    : null;

  return detailRows.filter((row) => {
    const categoryValue = getReportMatrixCategoryValue(row);
    const teamValue = getReportMatrixTeamValue(row);

    if (categoryFilter && categoryValue !== categoryFilter) {
      return false;
    }
    if (teamFilter && teamValue !== teamFilter) {
      return false;
    }
    if (
      !teamFilter &&
      selectedSellerTeams.size > 0 &&
      !selectedSellerTeams.has(teamValue)
    ) {
      return false;
    }
    if (visibleCategories && !visibleCategories.has(categoryValue)) {
      return false;
    }

    return true;
  });
}

function buildReportMatrixBodyRows({
  categoryRows,
  categoryRowsByGroup2,
  detailRowsByTeam,
  expandedCategoryKeys,
  expandedGroup2Keys,
  expandedGroup3Keys,
  expandedTeamKeys,
  group2Rows,
  group3Rows,
  group3RowsByCategory,
  hasGroup2,
  hasGroup3,
  teamRowsByParentKey,
}: {
  categoryRows: ReportMatrixRow[];
  categoryRowsByGroup2: Map<string, ReportMatrixRow[]>;
  detailRowsByTeam: Map<string, ReportMatrixRow[]>;
  expandedCategoryKeys: ReadonlySet<string>;
  expandedGroup2Keys: ReadonlySet<string>;
  expandedGroup3Keys: ReadonlySet<string>;
  expandedTeamKeys: ReadonlySet<string>;
  group2Rows: ReportMatrixRow[];
  group3Rows: ReportMatrixRow[];
  group3RowsByCategory: Map<string, ReportMatrixRow[]>;
  hasGroup2: boolean;
  hasGroup3: boolean;
  teamRowsByParentKey: Map<string, ReportMatrixRow[]>;
}) {
  const renderTeamBranch = (row: ReportMatrixRow) => {
    const sellerRows = detailRowsByTeam.get(row.key) ?? [];

    if (canExpandTeam(row) && !expandedTeamKeys.has(row.key)) {
      return [row];
    }

    if (!canExpandTeam(row)) {
      return [row];
    }

    return [row, ...sellerRows];
  };

  const renderGroup3Branch = (row: ReportMatrixRow) => {
    const group3TeamRows = teamRowsByParentKey.get(row.key) ?? [];
    const expandedTeamRows = group3TeamRows.flatMap(renderTeamBranch);

    if (canExpandGroup3(row) && !expandedGroup3Keys.has(row.key)) {
      return [row];
    }

    if (!canExpandGroup3(row)) {
      return [row];
    }

    return [row, ...expandedTeamRows];
  };

  const renderCategoryBranch = (row: ReportMatrixRow) => {
    const group2Label = row.filterValues?.group2 ?? "";
    const group1Label =
      row.filterValues?.category || String(row.category ?? "-");
    const parentGroup2Row = row.parentKey
      ? group2Rows.find((group2Row) => group2Row.key === row.parentKey)
      : undefined;
    const skipCategoryRow =
      isRedundantGroup1Category(group2Label, group1Label) &&
      !(parentGroup2Row && canExpandGroup2(parentGroup2Row));

    if (skipCategoryRow) {
      return [];
    }

    if (!hasGroup3) {
      const categoryTeamRows = teamRowsByParentKey.get(row.key) ?? [];
      const expandedTeamRows = categoryTeamRows.flatMap(renderTeamBranch);

      if (canExpandCategory(row, hasGroup3) && !expandedCategoryKeys.has(row.key)) {
        return [row];
      }

      if (!canExpandCategory(row, hasGroup3)) {
        return [row];
      }

      return [row, ...expandedTeamRows];
    }

    const groupedGroup3Rows = group3RowsByCategory.get(row.key) ?? [];
    const directTeamRows = teamRowsByParentKey.get(row.key) ?? [];
    const expandedGroup3Rows = groupedGroup3Rows.flatMap(renderGroup3Branch);
    const expandedDirectTeamRows = directTeamRows.flatMap(renderTeamBranch);
    const expandedChildren = [...expandedGroup3Rows, ...expandedDirectTeamRows];
    const showCategoryTier = shouldShowCategoryTier(row, hasGroup3) && !skipCategoryRow;

    if (showCategoryTier) {
      if (canExpandCategory(row, hasGroup3) && !expandedCategoryKeys.has(row.key)) {
        return [row];
      }

      return [row, ...expandedChildren];
    }

    if (canExpandCategory(row, hasGroup3) && !expandedCategoryKeys.has(row.key)) {
      return [row];
    }

    if (!canExpandCategory(row, hasGroup3)) {
      if (groupedGroup3Rows.length) {
        return groupedGroup3Rows;
      }

      if (directTeamRows.length) {
        return directTeamRows;
      }

      return [row];
    }

    return [row, ...expandedChildren];
  };

  if (hasGroup2) {
    return group2Rows.flatMap((group2Row) => {
      const groupedCategoryRows = categoryRowsByGroup2.get(group2Row.key) ?? [];
      const categoryBranches =
        groupedCategoryRows.flatMap(renderCategoryBranch);

      if (
        !canExpandGroup2(group2Row) ||
        !expandedGroup2Keys.has(group2Row.key)
      ) {
        return [group2Row];
      }

      return categoryBranches.length
        ? [group2Row, ...categoryBranches]
        : [group2Row];
    });
  }

  return categoryRows.flatMap((row) => renderCategoryBranch(row));
}

export function buildReportMatrixFilteredView({
  categoryFilter,
  detailRows,
  expandAll = false,
  expansion,
  group2Order,
  sellerFilter,
  teamFilter,
}: {
  categoryFilter: string;
  detailRows: ReportMatrixRow[];
  expandAll?: boolean;
  expansion?: ReportMatrixExpansionState;
  group2Order?: string[];
  sellerFilter: string;
  teamFilter: string;
}): ReportMatrixFilteredView {
  const filteredDetailRows = filterReportMatrixDetailRows(
    detailRows,
    categoryFilter,
    teamFilter,
    sellerFilter,
  );
  const comparisonDetailRows = buildComparisonDetailRows({
    categoryFilter,
    detailRows,
    filteredDetailRows,
    sellerFilter,
    teamFilter,
  });
  const aggregationDetailRows = sellerFilter
    ? filteredDetailRows
    : comparisonDetailRows;
  const hasGroup3 = reportMatrixDetailRowsHaveGroup3(detailRows);
  const hasGroup2 = reportMatrixDetailRowsHaveGroup2(detailRows);
  const group2Rows = hasGroup2
    ? buildReportMatrixGroup2Rows(aggregationDetailRows, group2Order)
    : [];
  const categoryRows = buildReportMatrixCategoryRows(aggregationDetailRows);
  const group3Rows = hasGroup3
    ? buildReportMatrixGroup3Rows(aggregationDetailRows)
    : [];
  const teamRows = buildReportMatrixTeamRows(aggregationDetailRows);
  const group3RowsByCategory = groupRowsByParentKey(group3Rows);
  const categoryRowsByGroup2 = groupRowsByParentKey(categoryRows);
  const teamRowsByParentKey = groupRowsByParentKey(teamRows);
  const detailRowsByTeam = groupRowsByParentKey(filteredDetailRows);
  const expandedGroup2Keys = resolveExpansionKeys(
    group2Rows,
    expansion?.group2Keys,
    expandAll,
  );
  const expandedCategoryKeys = resolveExpansionKeys(
    categoryRows,
    expansion?.categoryKeys,
    expandAll,
  );
  const expandedGroup3Keys = resolveExpansionKeys(
    group3Rows,
    expansion?.group3Keys,
    expandAll,
  );
  const expandedTeamKeys = resolveExpansionKeys(
    teamRows,
    expansion?.teamKeys,
    expandAll,
  );
  const bodyRows = buildReportMatrixBodyRows({
    categoryRows,
    categoryRowsByGroup2,
    detailRowsByTeam,
    expandedCategoryKeys,
    expandedGroup2Keys,
    expandedGroup3Keys,
    expandedTeamKeys,
    group2Rows,
    group3Rows,
    group3RowsByCategory,
    hasGroup2,
    hasGroup3,
    teamRowsByParentKey,
  });
  const totalRows = buildReportMatrixTotalRows(aggregationDetailRows);

  return {
    bodyRows,
    filteredDetailRows,
    filteredRows: [...bodyRows, ...totalRows],
    group2Rows,
    hasGroup2,
    hasGroup3,
    totalRows,
  };
}

export function collectReportMatrixExportTeams(rows: ReportMatrixRow[]) {
  const teams = new Set<string>();

  for (const row of rows) {
    const team = getReportMatrixTeamValue(row).trim();
    if (team) teams.add(team);
  }

  return [...teams].sort((left, right) =>
    left.localeCompare(right, "el", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export function collectReportMatrixExportMembers(rows: ReportMatrixRow[]) {
  const members = new Map<string, ReportMatrixExportMember>();

  for (const row of rows) {
    const seller = row.filterValues?.seller?.trim() ?? "";
    if (!seller) continue;

    const team = getReportMatrixTeamValue(row).trim();
    const sellerLabel =
      row.filterValues?.sellerLabel?.trim() ||
      seller.split("|").slice(1).join("|").trim() ||
      seller;
    const key = `${team}|${seller}`;

    if (!members.has(key)) {
      members.set(key, { seller, sellerLabel, team });
    }
  }

  return [...members.values()].sort((left, right) => {
    const teamCompare = left.team.localeCompare(right.team, "el", {
      numeric: true,
      sensitivity: "base",
    });
    if (teamCompare !== 0) return teamCompare;

    return left.sellerLabel.localeCompare(right.sellerLabel, "el", {
      numeric: true,
      sensitivity: "base",
    });
  });
}
