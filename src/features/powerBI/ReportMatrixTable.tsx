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
import { ExcelFileIcon } from "@/icons/excel-file";
import { PdfFileIcon } from "@/icons/pdf-file";
import type { FilterOption } from "@/features/powerBI/types/PowerBiTable.types";
import { getMatrixExportFileName } from "@/features/powerBI/PowerBiTable/utils";
import {
  buildSellerFilteredBodyRows,
  exportReportMatrixToExcel,
  getMatrixMetricDisplayValue,
} from "@/features/powerBI/reportMatrixExport";
import { exportReportMatrixToPdf } from "@/features/powerBI/reportMatrixPdfExport";
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
import type {
  ReportMatrixColumn,
  ReportMatrixRow,
  ReportMatrixTableProps,
} from "@/features/powerBI/types/ReportMatrixTable.types";
import { cn } from "@/lib/utils";

export type {
  ReportMatrixColumn,
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixRowMetrics,
  ReportMatrixSection,
  ReportMatrixSectionSummary,
  ReportMatrixTone,
} from "@/features/powerBI/types/ReportMatrixTable.types";

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

function canExpandCategory(_row: ReportMatrixRow) {
  return false;
}

function canExpandGroup2(row: ReportMatrixRow) {
  return row.rowKind === "group2" && (row.childCount ?? 0) > 1;
}

function canExpandGroup3(_row: ReportMatrixRow) {
  return false;
}

function canExpandTeam(_row: ReportMatrixRow) {
  return false;
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

const CATEGORY_COLUMN_MIN_WIDTH = 112;
const CATEGORY_COLUMN_MAX_WIDTH = 480;
const CATEGORY_COLUMN_HORIZONTAL_PADDING = 24;
const CATEGORY_COLUMN_CHEVRON_EXTRA = 22;

const CATEGORY_COLUMN_MEASURE_FONTS = [
  '900 0.88rem system-ui, -apple-system, "Segoe UI", sans-serif',
  '850 0.88rem system-ui, -apple-system, "Segoe UI", sans-serif',
  '800 0.78rem system-ui, -apple-system, "Segoe UI", sans-serif',
  '700 0.9rem system-ui, -apple-system, "Segoe UI", sans-serif',
];

function getCategoryColumnLabelText(value: ReactNode) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
}

function measureReportMatrixTextWidth(text: string, fonts: string[]) {
  if (!text || typeof document === "undefined") return 0;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;

  let maxWidth = 0;
  for (const font of fonts) {
    context.font = font;
    maxWidth = Math.max(maxWidth, context.measureText(text).width);
  }

  return maxWidth;
}

function measureReportMatrixCategoryColumnWidth(
  labels: string[],
  includeChevron = false,
) {
  if (!labels.length) return 168;

  let maxTextWidth = 0;
  for (const label of labels) {
    maxTextWidth = Math.max(
      maxTextWidth,
      measureReportMatrixTextWidth(label, CATEGORY_COLUMN_MEASURE_FONTS),
    );
  }

  const extra =
    CATEGORY_COLUMN_HORIZONTAL_PADDING +
    (includeChevron ? CATEGORY_COLUMN_CHEVRON_EXTRA : 0);

  return Math.min(
    Math.max(Math.ceil(maxTextWidth) + extra, CATEGORY_COLUMN_MIN_WIDTH),
    CATEGORY_COLUMN_MAX_WIDTH,
  );
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

function resolveFilterLabel(value: string, options: FilterOption[]) {
  if (!value) return "Όλα";
  return options.find((option) => option.value === value)?.label ?? value;
}

function resolveSellerFilterLabel(value: string, options: FilterOption[]) {
  if (!value) return "Όλα";

  const label = options.find((option) => option.value === value)?.label;
  if (label) return label;

  return value.split("|").slice(1).join("|").trim() || value;
}

function resolveSelectedSellerGroup2(
  rows: ReportMatrixRow[],
  category: string,
) {
  const matchingRows = category
    ? rows.filter((row) => {
        const categoryValue =
          row.filterValues?.category ?? String(row.category ?? "");
        return categoryValue === category;
      })
    : rows;

  return [
    ...new Set(
      matchingRows
        .map((row) => row.filterValues?.group2?.trim() ?? "")
        .filter(Boolean),
    ),
  ].join(", ");
}

function sellerExistsForFilters(
  rows: ReportMatrixRow[],
  seller: string,
  category: string,
  team: string,
) {
  return rows.some((row) => {
    const categoryValue =
      row.filterValues?.category ?? String(row.category ?? "");
    const teamValue =
      row.filterValues?.team ?? String(row.leadingValues?.team ?? "");
    const sellerValue = row.filterValues?.seller ?? "";

    if (category && categoryValue !== category) return false;
    if (team && teamValue !== team) return false;
    return sellerValue === seller;
  });
}

function getSectionGroupCellClassName(column: {
  isLastSection: boolean;
  isSectionBoundary: boolean;
  isSectionEnd: boolean;
  isSectionStart: boolean;
  sectionIndex: number;
}) {
  return cn(
    column.isSectionStart && "report-matrix__section-group-start",
    column.isSectionEnd &&
      !column.isLastSection &&
      "report-matrix__section-group-end",
    column.sectionIndex === 0 &&
      column.isSectionStart &&
      "report-matrix__section-start",
    column.isSectionBoundary && "report-matrix__section-boundary",
  );
}

export function ReportMatrixTable({
  brandLabel,
  categoryLabel = "Κατηγορία Στόχου",
  description,
  exportFileName,
  group2Order,
  headerLabel,
  hideSummaryPill = false,
  leadingColumns,
  periodSummary,
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
  const aggregationDetailRows = effectiveSellerFilter
    ? filteredDetailRows
    : comparisonDetailRows;
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
        ? buildReportMatrixGroup2Rows(aggregationDetailRows, group2Order)
        : [],
    [aggregationDetailRows, group2Order, hasGroup2],
  );
  const categoryRows = useMemo(
    () => buildReportMatrixCategoryRows(aggregationDetailRows),
    [aggregationDetailRows],
  );
  const group3Rows = useMemo(
    () => (hasGroup3 ? buildReportMatrixGroup3Rows(aggregationDetailRows) : []),
    [aggregationDetailRows, hasGroup3],
  );
  const teamRows = useMemo(
    () => buildReportMatrixTeamRows(aggregationDetailRows),
    [aggregationDetailRows],
  );

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
    if (effectiveSellerFilter) {
      return buildSellerFilteredBodyRows({
        categoryRows,
        categoryRowsByGroup2,
        group2Rows,
        group3Rows,
        group3RowsByCategory,
        hasGroup2,
        hasGroup3,
      });
    }

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
      const group3TeamRows = teamRowsByGroup3.get(row.key) ?? [];
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
        const categoryTeamRows = teamRowsByCategory.get(row.key) ?? [];
        const expandedTeamRows = categoryTeamRows.flatMap(renderTeamBranch);

        if (canExpandCategory(row) && !expandedCategoryKeys.has(row.key)) {
          return [row];
        }

        if (!canExpandCategory(row)) {
          return [row];
        }

        return [row, ...expandedTeamRows];
      }

      const groupedGroup3Rows = group3RowsByCategory.get(row.key) ?? [];
      const directTeamRows = teamRowsByCategory.get(row.key) ?? [];
      const expandedGroup3Rows = groupedGroup3Rows.flatMap(renderGroup3Branch);
      const expandedDirectTeamRows = directTeamRows.flatMap(renderTeamBranch);
      const expandedChildren = [
        ...expandedGroup3Rows,
        ...expandedDirectTeamRows,
      ];

      if (canExpandCategory(row) && !expandedCategoryKeys.has(row.key)) {
        return [row];
      }

      if (!canExpandCategory(row)) {
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
        const groupedCategoryRows =
          categoryRowsByGroup2.get(group2Row.key) ?? [];
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
    group3Rows,
    group3RowsByCategory,
    hasGroup2,
    hasGroup3,
    teamRowsByCategory,
    teamRowsByGroup3,
  ]);

  const totalRows = useMemo(
    () => buildReportMatrixTotalRows(aggregationDetailRows),
    [aggregationDetailRows],
  );

  const filteredRows = useMemo(
    () => [...bodyRows, ...totalRows],
    [bodyRows, totalRows],
  );

  const categoryColumnWidth = useMemo(() => {
    const labels = filteredRows
      .map((row) =>
        getCategoryColumnLabelText(getLeadingValue(row, "category")),
      )
      .filter(Boolean);
    const headerText = getCategoryColumnLabelText(categoryLabel);

    if (headerText) {
      labels.push(headerText);
    }

    const includeChevron = filteredRows.some(
      (row) =>
        row.rowKind === "group2" &&
        canExpandGroup2(row) &&
        !effectiveSellerFilter,
    );

    return measureReportMatrixCategoryColumnWidth(labels, includeChevron);
  }, [categoryLabel, effectiveSellerFilter, filteredRows]);

  const resolvedLeadingColumns = useMemo(() => {
    const columns = leadingColumns ?? [
      { key: "category", label: categoryLabel, width: 168 },
    ];

    return columns.map((column) =>
      column.key === "category"
        ? { ...column, width: categoryColumnWidth }
        : column,
    );
  }, [categoryColumnWidth, categoryLabel, leadingColumns]);

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

    if (
      sellerFilter &&
      !sellerExistsForFilters(
        detailRows,
        sellerFilter,
        nextCategory,
        teamFilter,
      )
    ) {
      setSellerFilter("");
    }
  }

  function handleTeamFilterChange(nextTeam: string) {
    setTeamFilter(nextTeam);
    setSellerFilter("");
  }

  function handleSellerFilterChange(nextSeller: string) {
    if (!nextSeller) {
      setSellerFilter("");
      return;
    }

    const team =
      sellerOptionRows.find((row) => row.filterValues?.seller === nextSeller)
        ?.filterValues?.team ?? "";

    setSellerFilter(nextSeller);
    if (team) {
      setTeamFilter(team);
    }
  }

  function resolveExportFileName() {
    return getMatrixExportFileName(exportFileName, brandLabel, {
      category: categoryFilter
        ? {
            value: categoryFilter,
            label: resolveFilterLabel(categoryFilter, categoryOptions),
          }
        : undefined,
      seller: effectiveSellerFilter
        ? {
            value: effectiveSellerFilter,
            label: resolveSellerFilterLabel(
              effectiveSellerFilter,
              sellerOptions,
            ),
          }
        : undefined,
    });
  }

  function handleExport() {
    exportReportMatrixToExcel({
      brandLabel,
      exportFileName: resolveExportFileName(),
      leadingColumns: resolvedLeadingColumns,
      rows: filteredRows,
      sections,
      sellerFilterActive: Boolean(effectiveSellerFilter),
    });
  }

  async function handlePdfExport() {
    await exportReportMatrixToPdf({
      brandLabel,
      categoryLabel,
      description,
      exportFileName: resolveExportFileName(),
      filters: {
        category: resolveFilterLabel(categoryFilter, categoryOptions),
        group2:
          effectiveSellerFilter && categoryFilter
            ? resolveSelectedSellerGroup2(filteredDetailRows, categoryFilter)
            : undefined,
        team: resolveFilterLabel(teamFilter, teamOptions),
        seller: resolveSellerFilterLabel(effectiveSellerFilter, sellerOptions),
      },
      headerLabel:
        typeof (headerLabel ?? brandLabel) === "string"
          ? String(headerLabel ?? brandLabel)
          : brandLabel,
      leadingColumns: resolvedLeadingColumns,
      periodSummary,
      rows: filteredRows,
      sections,
      sellerFilterActive: Boolean(effectiveSellerFilter),
    });
  }

  function renderLeadingCellContent(
    row: ReportMatrixRow,
    columnKey: string,
    content: ReactNode,
    isContextLabel = false,
  ) {
    if (row.isSellerFlattened && columnKey === "category") {
      return content;
    }

    if (columnKey === "category" && row.rowKind === "group3") {
      if (effectiveSellerFilter || !canExpandGroup3(row)) {
        return content;
      }

      const isExpanded = expandedGroup3Keys.has(row.key);

      return (
        <Button
          type="button"
          variant="ghost"
          className="report-matrix__category-toggle h-auto min-h-0 justify-start p-0 text-left whitespace-normal"
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
        </Button>
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
        <Button
          type="button"
          variant="ghost"
          className="report-matrix__category-toggle h-auto min-h-0 justify-start p-0 text-left whitespace-normal"
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
        </Button>
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
        <Button
          type="button"
          variant="ghost"
          className="report-matrix__category-toggle h-auto min-h-0 justify-start p-0 text-left whitespace-normal"
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
        </Button>
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
          row.rowKind === "group3" &&
            !row.isSellerFlattened &&
            "report-matrix__row--group3",
          row.isSellerFlattened && "report-matrix__row--seller-flat",
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
              <Button
                type="button"
                variant="ghost"
                className="report-matrix__category-toggle h-auto min-h-0 justify-start p-0 text-left whitespace-normal"
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
              </Button>
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
            const cellContent =
              row.isSellerFlattened && column.key === "category"
                ? renderValue(rawValue)
                : renderTruncatedCell(rawValue, title);
            const content = renderLeadingCellContent(
              row,
              column.key,
              cellContent,
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
          const metricValue = getMatrixMetricDisplayValue(row, column.key, {
            sellerFilterActive: Boolean(effectiveSellerFilter),
          });
          const displayTone =
            metricValue === "" || metricValue == null ? "default" : tone;

          return (
            <td
              key={`${row.key}-${column.key}`}
              className={cn(
                "report-matrix__cell",
                getAlignClass(column.align),
                getSectionGroupCellClassName(column),
                displayTone !== "default" &&
                  `report-matrix__cell--${displayTone}`,
              )}
            >
              {renderValue(metricValue)}
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
      ? [`Κλειστοι μηνες: ${String(closedMonthsSummary.value)}`]
      : []),
    ...(previousPeriodSummary?.details ?? []).map((detail) => String(detail)),
  ];
  const columns = sections.flatMap((section, sectionIndex) =>
    section.columns.map((column, columnIndex) => ({
      ...column,
      isLastSection: sectionIndex === sections.length - 1,
      isSectionStart: columnIndex === 0,
      isSectionEnd: columnIndex === section.columns.length - 1,
      isSectionBoundary: sectionIndex > 0 && columnIndex === 0,
      sectionIndex,
      sectionKey: section.key,
      sectionTone: section.tone,
    })),
  );
  return (
    <section ref={cardRef} className="app-card report-matrix-card">
      <div className="report-matrix-card__header">
        <div className="report-matrix-card__filters">
          <PowerBiTableHeaderFilter
            label={categoryLabel}
            options={categoryOptions}
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
          />
          <PowerBiTableHeaderFilter
            label="TEAM"
            options={teamOptions}
            value={teamFilter}
            onChange={handleTeamFilterChange}
          />
          <PowerBiTableHeaderFilter
            fitContent
            label="Seller name"
            options={sellerOptions}
            value={effectiveSellerFilter}
            onChange={handleSellerFilterChange}
          />
        </div>
        <div className="min-w-0">
          {title ? (
            <h2 className="report-matrix-card__title">{title}</h2>
          ) : null}
          {description ? (
            <p className="report-matrix-card__description">{description}</p>
          ) : null}
        </div>
        <div className="report-matrix-card__controls">
          {mergedSummary && !hideSummaryPill ? (
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
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 px-3.5 text-sm"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              <AppIcon
                name="bi-arrow-counterclockwise"
                className="size-5"
                size={20}
              />
              Reset filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 px-3.5 text-sm"
              disabled={!filteredRows.length}
              onClick={handleExport}
            >
              <ExcelFileIcon className="size-5" size={20} />
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 px-3.5 text-sm"
              disabled={!filteredRows.length}
              onClick={() => void handlePdfExport()}
            >
              <PdfFileIcon className="size-5" size={20} />
              PDF
            </Button>
          </div>
        </div>
      </div>
      <div ref={viewportRef} className="report-matrix__viewport">
        <table className="report-matrix">
          <caption className="sr-only">{brandLabel}</caption>
          <thead>
            <tr>
              {resolvedLeadingColumns.map((column, index) => (
                <th
                  key={column.key}
                  rowSpan={2}
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
                  {column.label}
                </th>
              ))}
              {sections.map((section, sectionIndex) => (
                <th
                  key={section.key}
                  className={cn(
                    "report-matrix__section-heading",
                    "report-matrix__section-group-start",
                    sectionIndex < sections.length - 1 &&
                      "report-matrix__section-group-end",
                    sectionIndex > 0 && "report-matrix__section-boundary",
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
              {columns.map((column) => (
                <th
                  key={`${column.sectionKey}-${column.key}`}
                  className={cn(
                    "report-matrix__column-heading",
                    getSectionGroupCellClassName(column),
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
