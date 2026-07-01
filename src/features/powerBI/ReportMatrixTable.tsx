"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { PowerBiTableHeaderFilter } from "@/features/powerBI/PowerBiTable/PowerBiTableHeaderFilter";
import type { FilterOption } from "@/features/powerBI/PowerBiTable/types";
import { exportReportMatrixToExcel } from "@/features/powerBI/reportMatrixExport";
import {
  buildReportMatrixGroup2Rows,
  buildReportMatrixGroup3Rows,
  buildReportMatrixCategoryRows,
  buildReportMatrixTeamRows,
  buildReportMatrixTotalRows,
  isRedundantGroup1Category,
  reportMatrixDetailRowsHaveGroup2,
  reportMatrixDetailRowsHaveGroup3,
} from "@/features/powerBI/reportMatrixData";

export type ReportMatrixTone =
  | "danger"
  | "default"
  | "muted"
  | "primary"
  | "rose"
  | "success"
  | "warning";

export type ReportMatrixColumn = {
  key: string;
  label: ReactNode;
  align?: "center" | "left" | "right";
  headerTone?: ReportMatrixTone;
  cellTone?: ReportMatrixTone;
  width?: number;
};

export type ReportMatrixLeadingColumn = {
  key: string;
  label: ReactNode;
  width: number;
};

export type ReportMatrixSectionSummary = {
  details?: ReactNode[];
  label: ReactNode;
  tone?: ReportMatrixTone;
  value: ReactNode;
};

export type ReportMatrixSection = {
  key: string;
  summary?: ReportMatrixSectionSummary;
  title: ReactNode;
  columns: ReportMatrixColumn[];
  tone?: ReportMatrixTone;
};

export type ReportMatrixRowMetrics = {
  currency: number | null;
  hasClosedMonthStatus: boolean;
  openMonthTcyByMonth: Record<string, number>;
  tcyAll: number;
  tcyClosed: number;
  vTrend: number;
  vcyAll: number;
  vcyClosed: number;
  vlc: number;
  vlcAll: number;
};

export type ReportMatrixRow = {
  key: string;
  category: ReactNode;
  childCount?: number;
  filterValues?: {
    category: string;
    group2: string;
    group3?: string;
    seller: string;
    sellerLabel: string;
    team: string;
  };
  leadingValues?: Record<string, ReactNode>;
  metrics?: ReportMatrixRowMetrics;
  parentKey?: string;
  rowKind?: "category" | "detail" | "group2" | "group3" | "team" | "total";
  values: Record<string, ReactNode>;
  cellTones?: Record<string, ReportMatrixTone>;
  isTotal?: boolean;
};

type ReportMatrixTableProps = {
  brandLabel: string;
  caption: string;
  categoryLabel?: string;
  description?: string;
  exportFileName?: string;
  group2Order?: string[];
  headerLabel?: ReactNode;
  leadingColumns?: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  title?: string;
};

function cn(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const REPORT_MATRIX_MIN_VIEWPORT_HEIGHT = 240;

function syncReportMatrixViewportHeight(
  card: HTMLElement,
  viewport: HTMLElement,
) {
  const header = card.querySelector<HTMLElement>(".report-matrix-card__header");
  const headerHeight = header?.offsetHeight ?? 0;
  const appContent = card.closest(".app-content");
  const contentStyle = appContent ? getComputedStyle(appContent) : null;
  const paddingBottom = contentStyle
    ? Number.parseFloat(contentStyle.paddingBottom) || 0
    : Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--app-content-pad-bottom",
        ),
      ) || 0;
  const cardRect = card.getBoundingClientRect();
  const viewportTop = cardRect.top + headerHeight;
  const pageScrollbarHeight = Math.max(
    0,
    window.innerHeight - document.documentElement.clientHeight,
  );
  const maxAvailable = Math.max(
    REPORT_MATRIX_MIN_VIEWPORT_HEIGHT,
    Math.floor(
      document.documentElement.clientHeight -
        viewportTop -
        paddingBottom -
        pageScrollbarHeight,
    ),
  );
  const table = viewport.querySelector("table");
  const contentHeight = table?.scrollHeight ?? 0;
  const nextHeight = Math.min(
    Math.max(contentHeight, REPORT_MATRIX_MIN_VIEWPORT_HEIGHT),
    maxAvailable,
  );

  viewport.style.setProperty(
    "--report-matrix-viewport-height",
    `${nextHeight}px`,
  );
}

function getAlignClass(align: ReportMatrixColumn["align"]) {
  if (align === "left") return "report-matrix__cell--left";
  if (align === "center") return "report-matrix__cell--center";
  return "report-matrix__cell--right";
}

function renderValue(value: ReactNode) {
  return value == null || value === "" ? "" : value;
}

function getTruncationTitle(value: ReactNode, fallback = "") {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function renderTruncatedCell(value: ReactNode, title?: string) {
  const content = renderValue(value);

  if (typeof content !== "string" && typeof content !== "number") {
    return content;
  }

  const text = String(content);
  const resolvedTitle = title ?? text;

  return (
    <span
      className="report-matrix__cell-content"
      title={resolvedTitle && resolvedTitle !== "" ? resolvedTitle : undefined}
    >
      {text}
    </span>
  );
}

function canExpandCategory(row: ReportMatrixRow) {
  return row.rowKind === "category" && (row.childCount ?? 0) > 1;
}

function canExpandGroup2(row: ReportMatrixRow) {
  return row.rowKind === "group2" && (row.childCount ?? 0) >= 1;
}

function canExpandGroup3(row: ReportMatrixRow) {
  return row.rowKind === "group3" && (row.childCount ?? 0) > 1;
}

function canExpandTeam(row: ReportMatrixRow) {
  return row.rowKind === "team" && (row.childCount ?? 0) > 1;
}

function isGroup2SubcategoryRow(
  row: ReportMatrixRow,
  group2Rows: ReportMatrixRow[],
  hasGroup2: boolean,
) {
  if (!hasGroup2 || row.rowKind !== "category" || !row.parentKey) {
    return false;
  }

  return group2Rows.some((group2Row) => group2Row.key === row.parentKey);
}

function getLeadingValue(row: ReportMatrixRow, key: string) {
  if (key === "category") return row.category;
  return row.leadingValues?.[key];
}

function isLeadingContextLabel(row: ReportMatrixRow, columnKey: string) {
  if (columnKey === "category") {
    return row.rowKind === "team" || row.rowKind === "detail";
  }

  if (columnKey === "team") {
    return row.rowKind === "detail";
  }

  return false;
}

function buildFilterOptions(
  rows: ReportMatrixRow[],
  getValue: (row: ReportMatrixRow) => string,
  getLabel?: (row: ReportMatrixRow) => string,
): FilterOption[] {
  const options = new Map<string, string>();

  rows.forEach((row) => {
    const value = getValue(row).trim();
    if (!value) return;

    const label = (getLabel?.(row) ?? value).trim();
    if (!options.has(value)) {
      options.set(value, label || value);
    }
  });

  return [...options.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) =>
      left.label.localeCompare(right.label, "el", {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

function getFilterOptionLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ReportMatrixTable({
  brandLabel,
  caption,
  categoryLabel = "Κατηγορία Στόχου",
  description,
  exportFileName,
  group2Order,
  headerLabel,
  leadingColumns,
  rows,
  sections,
  title,
}: ReportMatrixTableProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [expandedGroup2Keys, setExpandedGroup2Keys] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedGroup3Keys, setExpandedGroup3Keys] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedCategoryKeys, setExpandedCategoryKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedTeamKeys, setExpandedTeamKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const cardRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const detailRows = useMemo(
    () => rows.filter((row) => !row.isTotal && row.rowKind === "detail"),
    [rows],
  );

  const categoryOptions = useMemo(
    () =>
      buildFilterOptions(
        detailRows,
        (row) => row.filterValues?.category ?? String(row.category ?? ""),
      ),
    [detailRows],
  );
  const teamOptions = useMemo(
    () =>
      buildFilterOptions(
        detailRows,
        (row) =>
          row.filterValues?.team ?? String(row.leadingValues?.team ?? ""),
      ),
    [detailRows],
  );

  const sellerOptionRows = useMemo(
    () =>
      detailRows.filter((row) => {
        const categoryValue =
          row.filterValues?.category ?? String(row.category ?? "");
        const teamValue =
          row.filterValues?.team ?? String(row.leadingValues?.team ?? "");

        if (categoryFilter && categoryValue !== categoryFilter) {
          return false;
        }
        if (teamFilter && teamValue !== teamFilter) {
          return false;
        }

        return true;
      }),
    [categoryFilter, detailRows, teamFilter],
  );

  const sellerOptions = useMemo(
    () =>
      buildFilterOptions(
        sellerOptionRows,
        (row) => row.filterValues?.seller ?? "",
        (row) => row.filterValues?.sellerLabel ?? "",
      ),
    [sellerOptionRows],
  );
  const effectiveSellerFilter =
    sellerFilter &&
    sellerOptions.some((option) => option.value === sellerFilter)
      ? sellerFilter
      : "";

  const hasActiveFilters = Boolean(
    categoryFilter || teamFilter || effectiveSellerFilter,
  );
  const selectedTeamLabel = teamFilter
    ? getFilterOptionLabel(teamOptions, teamFilter)
    : "";
  const selectedSellerLabel = effectiveSellerFilter
    ? getFilterOptionLabel(sellerOptions, effectiveSellerFilter)
    : "";

  const filteredDetailRows = useMemo(
    () =>
      detailRows.filter((row) => {
        const categoryValue =
          row.filterValues?.category ?? String(row.category ?? "");
        const teamValue =
          row.filterValues?.team ?? String(row.leadingValues?.team ?? "");
        const sellerValue = row.filterValues?.seller ?? "";

        if (categoryFilter && categoryValue !== categoryFilter) {
          return false;
        }
        if (teamFilter && teamValue !== teamFilter) {
          return false;
        }
        if (effectiveSellerFilter && sellerValue !== effectiveSellerFilter) {
          return false;
        }
        return true;
      }),
    [categoryFilter, detailRows, effectiveSellerFilter, teamFilter],
  );

  const selectedSellerTeams = useMemo(() => {
    if (!effectiveSellerFilter || teamFilter) return new Set<string>();

    return new Set(
      detailRows
        .filter((row) => row.filterValues?.seller === effectiveSellerFilter)
        .map((row) => row.filterValues?.team ?? "")
        .filter(Boolean),
    );
  }, [detailRows, effectiveSellerFilter, teamFilter]);

  const comparisonDetailRows = useMemo(() => {
    const visibleCategories = effectiveSellerFilter
      ? new Set(
          filteredDetailRows.map(
            (row) => row.filterValues?.category ?? String(row.category ?? ""),
          ),
        )
      : null;

    return detailRows.filter((row) => {
      const categoryValue =
        row.filterValues?.category ?? String(row.category ?? "");
      const teamValue =
        row.filterValues?.team ?? String(row.leadingValues?.team ?? "");

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
  }, [
    categoryFilter,
    detailRows,
    effectiveSellerFilter,
    filteredDetailRows,
    selectedSellerTeams,
    teamFilter,
  ]);
  const hasGroup3 = useMemo(
    () => reportMatrixDetailRowsHaveGroup3(detailRows),
    [detailRows],
  );
  const hasGroup2 = useMemo(
    () => reportMatrixDetailRowsHaveGroup2(detailRows),
    [detailRows],
  );

  const group2Rows = useMemo(
    () =>
      hasGroup2
        ? buildReportMatrixGroup2Rows(comparisonDetailRows, group2Order)
        : [],
    [comparisonDetailRows, group2Order, hasGroup2],
  );
  const categoryRows = useMemo(
    () => buildReportMatrixCategoryRows(comparisonDetailRows),
    [comparisonDetailRows],
  );
  const group3Rows = useMemo(
    () => (hasGroup3 ? buildReportMatrixGroup3Rows(comparisonDetailRows) : []),
    [comparisonDetailRows, hasGroup3],
  );
  const teamRows = useMemo(
    () => buildReportMatrixTeamRows(comparisonDetailRows),
    [comparisonDetailRows],
  );
  const expandableCategoryKeys = useMemo(
    () =>
      effectiveSellerFilter
        ? []
        : categoryRows
            .filter((row) => canExpandCategory(row))
            .map((row) => row.key),
    [categoryRows, effectiveSellerFilter],
  );
  const expandableGroup3Keys = useMemo(
    () =>
      effectiveSellerFilter
        ? []
        : group3Rows
            .filter((row) => canExpandGroup3(row))
            .map((row) => row.key),
    [effectiveSellerFilter, group3Rows],
  );
  const expandableTeamKeys = useMemo(
    () =>
      effectiveSellerFilter
        ? []
        : teamRows.filter((row) => canExpandTeam(row)).map((row) => row.key),
    [effectiveSellerFilter, teamRows],
  );
  const expandableGroup2Keys = useMemo(
    () =>
      effectiveSellerFilter
        ? []
        : group2Rows
            .filter((row) => canExpandGroup2(row))
            .map((row) => row.key),
    [effectiveSellerFilter, group2Rows],
  );
  const hasExpandableRows =
    expandableGroup2Keys.length > 0 ||
    expandableCategoryKeys.length > 0 ||
    expandableGroup3Keys.length > 0 ||
    expandableTeamKeys.length > 0;
  const areAllExpandableRowsExpanded =
    hasExpandableRows &&
    expandableGroup2Keys.every((key) => expandedGroup2Keys.has(key)) &&
    expandableCategoryKeys.every((key) => expandedCategoryKeys.has(key)) &&
    expandableGroup3Keys.every((key) => expandedGroup3Keys.has(key)) &&
    expandableTeamKeys.every((key) => expandedTeamKeys.has(key));

  const hierarchyStepCount = useMemo(() => {
    let count = 0;
    if (hasGroup2 && expandableGroup2Keys.length > 0) count++;
    if (expandableCategoryKeys.length > 0) count++;
    if (hasGroup3 && expandableGroup3Keys.length > 0) count++;
    return count;
  }, [
    expandableCategoryKeys.length,
    expandableGroup2Keys.length,
    expandableGroup3Keys.length,
    hasGroup2,
    hasGroup3,
  ]);

  const currentExpansionLevel = useMemo(() => {
    let step = 0;
    let level = 0;

    if (hasGroup2 && expandableGroup2Keys.length > 0) {
      const group2Expanded = expandableGroup2Keys.every((key) =>
        expandedGroup2Keys.has(key),
      );
      if (!group2Expanded) return 0;
      level = step + 1;
      step++;
    }

    if (expandableCategoryKeys.length > 0) {
      const categoriesExpanded = expandableCategoryKeys.every((key) =>
        expandedCategoryKeys.has(key),
      );
      if (!categoriesExpanded) return level;
      level = step + 1;
      step++;
    }

    if (hasGroup3 && expandableGroup3Keys.length > 0) {
      const group3Expanded = expandableGroup3Keys.every((key) =>
        expandedGroup3Keys.has(key),
      );
      if (!group3Expanded) return level;
      level = step + 1;
    }

    return level;
  }, [
    expandableCategoryKeys,
    expandableGroup2Keys,
    expandableGroup3Keys,
    expandedCategoryKeys,
    expandedGroup2Keys,
    expandedGroup3Keys,
    hasGroup2,
    hasGroup3,
  ]);

  const canExpandOneHierarchyLevel =
    !effectiveSellerFilter &&
    hierarchyStepCount > 0 &&
    currentExpansionLevel < hierarchyStepCount;
  const canCollapseOneHierarchyLevel =
    !effectiveSellerFilter && currentExpansionLevel > 0;
  const nextExpansionLevel = currentExpansionLevel + 1;

  const group3RowsByCategory = useMemo(() => {
    const groupedRows = new Map<string, ReportMatrixRow[]>();

    for (const row of group3Rows) {
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
  }, [group3Rows]);

  const teamRowsByCategory = useMemo(() => {
    const groupedRows = new Map<string, ReportMatrixRow[]>();

    for (const row of teamRows) {
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
  }, [teamRows]);

  const categoryRowsByGroup2 = useMemo(() => {
    const groupedRows = new Map<string, ReportMatrixRow[]>();

    for (const row of categoryRows) {
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
  }, [categoryRows]);

  const teamRowsByGroup3 = useMemo(() => {
    const groupedRows = new Map<string, ReportMatrixRow[]>();

    for (const row of teamRows) {
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
  }, [teamRows]);

  const detailRowsByTeam = useMemo(() => {
    const groupedRows = new Map<string, ReportMatrixRow[]>();

    for (const row of filteredDetailRows) {
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
  }, [filteredDetailRows]);

  const bodyRows = useMemo(() => {
    const renderTeamBranch = (row: ReportMatrixRow) => {
      const sellerRows = detailRowsByTeam.get(row.key) ?? [];

      if (effectiveSellerFilter) {
        return sellerRows.length ? [row, ...sellerRows] : [row];
      }

      if (canExpandTeam(row) && !expandedTeamKeys.has(row.key)) {
        return [row];
      }

      if (!canExpandTeam(row)) {
        return sellerRows.length ? sellerRows : [row];
      }

      return [row, ...sellerRows];
    };

    const renderGroup3Branch = (row: ReportMatrixRow) => {
      const group3TeamRows = teamRowsByGroup3.get(row.key) ?? [];
      const expandedTeamRows = group3TeamRows.flatMap(renderTeamBranch);

      if (effectiveSellerFilter) {
        return expandedTeamRows.length ? [row, ...expandedTeamRows] : [row];
      }

      if (canExpandGroup3(row) && !expandedGroup3Keys.has(row.key)) {
        return [row];
      }

      if (!canExpandGroup3(row)) {
        return expandedTeamRows.length ? expandedTeamRows : [row];
      }

      return [row, ...expandedTeamRows];
    };

    const renderCategoryBranch = (row: ReportMatrixRow) => {
      const group2Label = row.filterValues?.group2 ?? "";
      const group1Label =
        row.filterValues?.category || String(row.category ?? "-");
      const skipCategoryRow =
        !hasGroup2 &&
        isRedundantGroup1Category(group2Label, group1Label);

      const renderCategoryChildren = () => {
        if (hasGroup3) {
          const groupedGroup3Rows = group3RowsByCategory.get(row.key) ?? [];
          const directTeamRows = teamRowsByCategory.get(row.key) ?? [];
          const expandedGroup3Rows =
            groupedGroup3Rows.flatMap(renderGroup3Branch);
          const expandedDirectTeamRows =
            directTeamRows.flatMap(renderTeamBranch);
          const expandedChildren = [
            ...expandedGroup3Rows,
            ...expandedDirectTeamRows,
          ];

          if (effectiveSellerFilter) {
            return expandedChildren.length ? expandedChildren : [];
          }

          if (skipCategoryRow) {
            return expandedChildren;
          }

          if (canExpandCategory(row) && !expandedCategoryKeys.has(row.key)) {
            return [row];
          }

          if (!canExpandCategory(row)) {
            return expandedChildren.length ? expandedChildren : [row];
          }

          return [row, ...expandedChildren];
        }

        const categoryTeamRows = teamRowsByCategory.get(row.key) ?? [];
        const expandedTeamRows = categoryTeamRows.flatMap(renderTeamBranch);

        if (effectiveSellerFilter) {
          return expandedTeamRows.length ? expandedTeamRows : [];
        }

        if (skipCategoryRow) {
          return expandedTeamRows.length ? expandedTeamRows : [];
        }

        if (canExpandCategory(row) && !expandedCategoryKeys.has(row.key)) {
          return [row];
        }

        if (!canExpandCategory(row)) {
          return expandedTeamRows.length ? expandedTeamRows : [row];
        }

        return [row, ...expandedTeamRows];
      };

      return renderCategoryChildren();
    };

    if (hasGroup2) {
      return group2Rows.flatMap((group2Row) => {
        const groupedCategoryRows =
          categoryRowsByGroup2.get(group2Row.key) ?? [];
        const categoryBranches =
          groupedCategoryRows.flatMap(renderCategoryBranch);

        if (effectiveSellerFilter) {
          return canExpandGroup2(group2Row)
            ? [group2Row, ...categoryBranches]
            : categoryBranches.length
              ? categoryBranches
              : [group2Row];
        }

        if (
          canExpandGroup2(group2Row) &&
          !expandedGroup2Keys.has(group2Row.key)
        ) {
          return [group2Row];
        }

        return categoryBranches.length
          ? [group2Row, ...categoryBranches]
          : [group2Row];
      });
    }

    return categoryRows.flatMap((row) => {
      return renderCategoryBranch(row);
    });
  }, [
    categoryRowsByGroup2,
    categoryRows,
    detailRowsByTeam,
    effectiveSellerFilter,
    expandedGroup2Keys,
    expandedCategoryKeys,
    expandedGroup3Keys,
    expandedTeamKeys,
    group2Rows,
    group3RowsByCategory,
    hasGroup3,
    hasGroup2,
    teamRowsByCategory,
    teamRowsByGroup3,
  ]);

  const totalRows = useMemo(
    () => buildReportMatrixTotalRows(comparisonDetailRows),
    [comparisonDetailRows],
  );

  const filteredRows = useMemo(
    () => [...bodyRows, ...totalRows],
    [bodyRows, totalRows],
  );

  useLayoutEffect(() => {
    const card = cardRef.current;
    const viewport = viewportRef.current;
    if (!card || !viewport) return;

    const sync = () => syncReportMatrixViewportHeight(card, viewport);

    sync();

    window.addEventListener("resize", sync);

    const observer = new ResizeObserver(sync);
    observer.observe(card);
    observer.observe(viewport);

    const table = viewport.querySelector("table");
    if (table) observer.observe(table);

    return () => {
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, [filteredRows.length, title, description, sections.length]);

  function resetFilters() {
    setCategoryFilter("");
    setTeamFilter("");
    setSellerFilter("");
    setExpandedGroup2Keys(new Set());
    setExpandedCategoryKeys(new Set());
    setExpandedGroup3Keys(new Set());
    setExpandedTeamKeys(new Set());
  }

  function toggleGroup3(rowKey: string) {
    setExpandedGroup3Keys((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }

  function toggleGroup2(rowKey: string) {
    setExpandedGroup2Keys((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }

  function toggleCategory(rowKey: string) {
    setExpandedCategoryKeys((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }

  function applyExpansionLevel(targetLevel: number) {
    let step = 0;

    if (hasGroup2 && expandableGroup2Keys.length > 0) {
      setExpandedGroup2Keys(
        targetLevel > step ? new Set(expandableGroup2Keys) : new Set(),
      );
      step++;
    }

    if (expandableCategoryKeys.length > 0) {
      setExpandedCategoryKeys(
        targetLevel > step ? new Set(expandableCategoryKeys) : new Set(),
      );
      step++;
    } else {
      setExpandedCategoryKeys(new Set());
    }

    if (hasGroup3 && expandableGroup3Keys.length > 0) {
      setExpandedGroup3Keys(
        targetLevel > step ? new Set(expandableGroup3Keys) : new Set(),
      );
    } else {
      setExpandedGroup3Keys(new Set());
    }

    setExpandedTeamKeys(new Set());
  }

  function expandOneHierarchyLevel() {
    applyExpansionLevel(currentExpansionLevel + 1);
  }

  function collapseOneHierarchyLevel() {
    applyExpansionLevel(currentExpansionLevel - 1);
  }

  function toggleAllCategories() {
    const shouldCollapse =
      expandableGroup2Keys.every((key) => expandedGroup2Keys.has(key)) &&
      expandableCategoryKeys.every((key) => expandedCategoryKeys.has(key)) &&
      expandableGroup3Keys.every((key) => expandedGroup3Keys.has(key)) &&
      expandableTeamKeys.every((key) => expandedTeamKeys.has(key));

    if (shouldCollapse) {
      setExpandedGroup2Keys(new Set());
      setExpandedCategoryKeys(new Set());
      setExpandedGroup3Keys(new Set());
      setExpandedTeamKeys(new Set());
      return;
    }

    setExpandedGroup2Keys(new Set(expandableGroup2Keys));
    setExpandedCategoryKeys(new Set(expandableCategoryKeys));
    setExpandedGroup3Keys(new Set(expandableGroup3Keys));
    setExpandedTeamKeys(new Set(expandableTeamKeys));
  }

  function toggleTeam(rowKey: string) {
    setExpandedTeamKeys((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }

  function handleCategoryFilterChange(nextCategory: string) {
    setCategoryFilter(nextCategory);
    setSellerFilter("");
  }

  function handleTeamFilterChange(nextTeam: string) {
    setTeamFilter(nextTeam);
    setSellerFilter("");
  }

  const resolvedLeadingColumns = leadingColumns ?? [
    { key: "category", label: categoryLabel, width: 220 },
  ];

  function handleExport() {
    exportReportMatrixToExcel({
      brandLabel,
      exportFileName,
      leadingColumns: resolvedLeadingColumns,
      rows: filteredRows,
      sections,
    });
  }

  function renderLeadingCellContent(
    row: ReportMatrixRow,
    columnKey: string,
    content: ReactNode,
    isContextLabel = false,
  ) {
    if (columnKey === "category" && row.rowKind === "group3") {
      if (effectiveSellerFilter || !canExpandGroup3(row)) {
        return content;
      }

      const isExpanded = expandedGroup3Keys.has(row.key);

      return (
        <button
          type="button"
          className="report-matrix__category-toggle"
          aria-expanded={isExpanded}
          onClick={() => toggleGroup3(row.key)}
        >
          <AppIcon
            name={isExpanded ? "bi-chevron-down" : "bi-chevron-right"}
            className="report-matrix__category-toggle-icon"
            size={16}
          />
          <span className="report-matrix__category-toggle-label">
            {content}
          </span>
        </button>
      );
    }

    if (columnKey === "category" && row.rowKind === "category") {
      if (effectiveSellerFilter || !canExpandCategory(row)) {
        return isContextLabel ? (
          <span className="report-matrix__context-label">{content}</span>
        ) : (
          content
        );
      }

      const isExpanded = expandedCategoryKeys.has(row.key);

      return (
        <button
          type="button"
          className="report-matrix__category-toggle"
          aria-expanded={isExpanded}
          onClick={() => toggleCategory(row.key)}
        >
          <AppIcon
            name={isExpanded ? "bi-chevron-down" : "bi-chevron-right"}
            className="report-matrix__category-toggle-icon"
            size={16}
          />
          <span className="report-matrix__category-toggle-label">
            {content}
          </span>
        </button>
      );
    }

    if (columnKey === "team" && row.rowKind === "team") {
      if (effectiveSellerFilter || !canExpandTeam(row)) {
        return isContextLabel ? (
          <span className="report-matrix__context-label">{content}</span>
        ) : (
          content
        );
      }

      const isExpanded = expandedTeamKeys.has(row.key);

      return (
        <button
          type="button"
          className="report-matrix__category-toggle"
          aria-expanded={isExpanded}
          onClick={() => toggleTeam(row.key)}
        >
          <AppIcon
            name={isExpanded ? "bi-chevron-down" : "bi-chevron-right"}
            className="report-matrix__category-toggle-icon"
            size={16}
          />
          <span className="report-matrix__category-toggle-label">
            {content}
          </span>
        </button>
      );
    }

    if (row.rowKind === "detail" && columnKey === "seller") {
      return <span className="report-matrix__detail-label">{content}</span>;
    }

    if (isContextLabel) {
      return <span className="report-matrix__context-label">{content}</span>;
    }

    return content;
  }

  function renderMatrixRow(row: ReportMatrixRow) {
    const isGroup2Row = row.rowKind === "group2";
    const isGroup2Subcategory = isGroup2SubcategoryRow(
      row,
      group2Rows,
      hasGroup2,
    );

    return (
      <tr
        key={row.key}
        className={cn(
          isGroup2Row && "report-matrix__row--group2",
          row.rowKind === "category" &&
            !isGroup2Subcategory &&
            "report-matrix__row--category",
          isGroup2Subcategory && "report-matrix__row--group2-subcategory",
          row.rowKind === "group3" && "report-matrix__row--group3",
          row.rowKind === "team" && "report-matrix__row--team",
          row.rowKind === "detail" && "report-matrix__row--detail",
          row.isTotal && "report-matrix__row--total",
        )}
      >
        {isGroup2Row ? (
          <th
            className="report-matrix__group2-cell"
            colSpan={resolvedLeadingColumns.length}
            scope="rowgroup"
            style={{ left: 0, minWidth: leadingWidth, width: leadingWidth }}
            title={getTruncationTitle(row.category)}
          >
            {!effectiveSellerFilter && canExpandGroup2(row) ? (
              <button
                type="button"
                className="report-matrix__category-toggle"
                aria-expanded={expandedGroup2Keys.has(row.key)}
                onClick={() => toggleGroup2(row.key)}
              >
                <AppIcon
                  name={
                    expandedGroup2Keys.has(row.key)
                      ? "bi-chevron-down"
                      : "bi-chevron-right"
                  }
                  className="report-matrix__category-toggle-icon"
                  size={16}
                />
                <span className="report-matrix__category-toggle-label">
                  {renderTruncatedCell(
                    row.category,
                    getTruncationTitle(row.category),
                  )}
                </span>
              </button>
            ) : (
              renderTruncatedCell(
                row.category,
                getTruncationTitle(row.category),
              )
            )}
          </th>
        ) : (
          resolvedLeadingColumns.map((column, index) => {
            const isContextLabel = isLeadingContextLabel(row, column.key);
            const rawValue = getLeadingValue(row, column.key);
            const title =
              column.key === "seller"
                ? row.filterValues?.sellerLabel
                : getTruncationTitle(rawValue);
            const content = renderLeadingCellContent(
              row,
              column.key,
              renderTruncatedCell(rawValue, title),
              isContextLabel,
            );
            const className = cn(
              index === 0
                ? "report-matrix__category-cell"
                : "report-matrix__dimension-cell",
              isContextLabel && "report-matrix__leading-cell--context",
            );
            const style = {
              left: leadingOffsets[index],
              minWidth: column.width,
              width: column.width,
            };

            return index === 0 ? (
              <th
                key={column.key}
                className={className}
                scope="row"
                style={style}
                title={title && title !== "—" ? title : undefined}
              >
                {content}
              </th>
            ) : (
              <td
                key={column.key}
                className={className}
                style={style}
                title={title && title !== "—" ? title : undefined}
              >
                {content}
              </td>
            );
          })
        )}
        {columns.map((column) => {
          const tone =
            row.cellTones?.[column.key] ?? column.cellTone ?? "default";

          return (
            <td
              key={`${row.key}-${column.key}`}
              className={cn(
                "report-matrix__cell",
                getAlignClass(column.align),
                column.isSectionStart && "report-matrix__section-start",
                tone !== "default" && `report-matrix__cell--${tone}`,
              )}
            >
              {renderValue(row.values[column.key])}
            </td>
          );
        })}
      </tr>
    );
  }

  const leadingOffsets = resolvedLeadingColumns.reduce<number[]>(
    (offsets, column, index) => {
      offsets.push(index === 0 ? 0 : offsets[index - 1] + column.width);
      return offsets;
    },
    [],
  );
  const leadingWidth = resolvedLeadingColumns.reduce(
    (sum, column) => sum + column.width,
    0,
  );
  const resolvedHeaderLabel = headerLabel ?? brandLabel;
  const previousPeriodSummary = sections.find(
    (section) => section.key === "previous-period",
  )?.summary;
  const closedMonthsSummary = sections.find(
    (section) => section.key === "year-comparison",
  )?.summary;
  const fallbackSummary = sections.find((section) => section.summary)?.summary;
  const mergedSummary =
    previousPeriodSummary ?? closedMonthsSummary ?? fallbackSummary;
  const summaryPillDetails = [
    ...(closedMonthsSummary?.value != null && closedMonthsSummary.value !== ""
      ? [`Κλειστοί μήνες: ${String(closedMonthsSummary.value)}`]
      : []),
    ...(previousPeriodSummary?.details ?? []).map((detail) => String(detail)),
  ];
  const columns = sections.flatMap((section) =>
    section.columns.map((column, index) => ({
      ...column,
      isSectionStart: index === 0,
      sectionKey: section.key,
      sectionTone: section.tone,
    })),
  );
  return (
    <section ref={cardRef} className="app-card report-matrix-card">
      <div className="report-matrix-card__header">
        <div className="min-w-0">
          {title ? (
            <h2 className="report-matrix-card__title">{title}</h2>
          ) : null}
          {description ? (
            <p className="report-matrix-card__description">{description}</p>
          ) : null}
        </div>
        <div className="report-matrix-card__controls">
          <div className="report-matrix-card__hierarchy-controls">
            {canExpandOneHierarchyLevel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="report-matrix-card__hierarchy-button"
                aria-label={`Expand hierarchy level ${nextExpansionLevel}`}
                onClick={expandOneHierarchyLevel}
              >
                <AppIcon name="bi-chevron-down" size={14} />
                Επέκταση επιπέδου{" "}
                <span className="report-matrix-card__hierarchy-button-level">
                  {nextExpansionLevel}
                </span>
              </Button>
            ) : null}
            {canCollapseOneHierarchyLevel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="report-matrix-card__hierarchy-button"
                aria-label={`Collapse hierarchy level ${currentExpansionLevel}`}
                onClick={collapseOneHierarchyLevel}
              >
                <AppIcon name="bi-chevron-left" size={14} />
                Σύμπτυξη επιπέδου{" "}
                <span className="report-matrix-card__hierarchy-button-level">
                  {currentExpansionLevel}
                </span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="report-matrix-card__hierarchy-button"
              disabled={!hasExpandableRows || Boolean(effectiveSellerFilter)}
              aria-label={
                areAllExpandableRowsExpanded
                  ? "Collapse all expandable rows"
                  : "Expand all expandable rows"
              }
              aria-pressed={areAllExpandableRowsExpanded}
              onClick={toggleAllCategories}
            >
              <AppIcon name="bi-unfold-vertical" size={14} />
              {areAllExpandableRowsExpanded
                ? "Σύμπτυξη όλων"
                : "Επέκταση όλων"}
            </Button>
          </div>
          {mergedSummary ? (
            <div
              className={cn(
                "report-matrix-card__summary-pill",
                mergedSummary.tone &&
                  `report-matrix-card__summary-pill--${mergedSummary.tone}`,
              )}
            >
              <span className="report-matrix-card__summary-pill-label">
                {mergedSummary.label}:
              </span>
              <strong className="report-matrix-card__summary-pill-value">
                {mergedSummary.value}
              </strong>
              {summaryPillDetails.length ? (
                <span className="report-matrix-card__summary-pill-details">
                  {summaryPillDetails.map((detail, summaryIndex) => (
                    <span
                      key={`summary-pill-${summaryIndex}`}
                      className="report-matrix-card__summary-pill-detail"
                    >
                      {detail}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="report-matrix-card__actions">
            {teamFilter || effectiveSellerFilter ? (
              <div className="report-matrix-card__active-filters">
                {teamFilter ? (
                  <span className="report-matrix-filter-pill">
                    <span className="report-matrix-filter-pill__label">
                      Team
                    </span>
                    <span className="report-matrix-filter-pill__value">
                      {selectedTeamLabel}
                    </span>
                    <button
                      type="button"
                      className="report-matrix-filter-pill__clear"
                      aria-label={`Clear Team filter ${selectedTeamLabel}`}
                      onClick={() => handleTeamFilterChange("")}
                    >
                      ×
                    </button>
                  </span>
                ) : null}
                {effectiveSellerFilter ? (
                  <span className="report-matrix-filter-pill">
                    <span className="report-matrix-filter-pill__label">
                      Seller
                    </span>
                    <span className="report-matrix-filter-pill__value">
                      {selectedSellerLabel}
                    </span>
                    <button
                      type="button"
                      className="report-matrix-filter-pill__clear"
                      aria-label={`Clear Seller filter ${selectedSellerLabel}`}
                      onClick={() => setSellerFilter("")}
                    >
                      ×
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              <AppIcon
                name="bi-arrow-counterclockwise"
                className="mr-1"
                size={14}
              />
              Reset filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!filteredRows.length}
              onClick={handleExport}
            >
              <AppIcon
                name="bi-file-earmark-excel"
                className="mr-1"
                size={14}
              />
              Excel
            </Button>
          </div>
        </div>
      </div>
      <div ref={viewportRef} className="report-matrix__viewport">
        <table className="report-matrix">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th
                className="report-matrix__brand-cell"
                colSpan={resolvedLeadingColumns.length}
                scope="colgroup"
                style={{ left: 0, minWidth: leadingWidth, width: leadingWidth }}
              >
                {resolvedHeaderLabel}
              </th>
              {sections.map((section) => (
                <th
                  key={section.key}
                  className={cn(
                    "report-matrix__section-heading",
                    section.tone &&
                      `report-matrix__section-heading--${section.tone}`,
                  )}
                  colSpan={section.columns.length}
                  scope="colgroup"
                >
                  <span className="report-matrix__section-title">
                    {section.title}
                  </span>
                </th>
              ))}
            </tr>
            <tr>
              {resolvedLeadingColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    "report-matrix__leading-heading",
                    index === 0 && "report-matrix__category-heading",
                    "report-matrix__leading-heading--filter",
                  )}
                  scope="col"
                  style={{
                    left: leadingOffsets[index],
                    minWidth: column.width,
                    width: column.width,
                  }}
                >
                  {column.key === "category" ? (
                    <PowerBiTableHeaderFilter
                      label={
                        typeof column.label === "string"
                          ? column.label
                          : categoryLabel
                      }
                      options={categoryOptions}
                      value={categoryFilter}
                      onChange={handleCategoryFilterChange}
                    />
                  ) : column.key === "team" ? (
                    <PowerBiTableHeaderFilter
                      label={
                        typeof column.label === "string" ? column.label : "Team"
                      }
                      options={teamOptions}
                      value={teamFilter}
                      onChange={handleTeamFilterChange}
                    />
                  ) : column.key === "seller" ? (
                    <PowerBiTableHeaderFilter
                      label={
                        typeof column.label === "string"
                          ? column.label
                          : "Seller"
                      }
                      options={sellerOptions}
                      value={effectiveSellerFilter}
                      onChange={setSellerFilter}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {columns.map((column) => (
                <th
                  key={`${column.sectionKey}-${column.key}`}
                  className={cn(
                    "report-matrix__column-heading",
                    column.isSectionStart && "report-matrix__section-start",
                    column.sectionTone &&
                      `report-matrix__column-heading--section-${column.sectionTone}`,
                    column.headerTone &&
                      `report-matrix__column-heading--${column.headerTone}`,
                    getAlignClass(column.align),
                  )}
                  scope="col"
                  style={
                    column.width
                      ? { minWidth: column.width, width: column.width }
                      : undefined
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{bodyRows.map(renderMatrixRow)}</tbody>
          {totalRows.length ? (
            <tfoot className="report-matrix__footer">
              {totalRows.map(renderMatrixRow)}
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}
