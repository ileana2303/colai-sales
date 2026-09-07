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
  exportReportMatrixToExcel,
  getMatrixMetricDisplayValue,
} from "@/features/powerBI/reportMatrixExport";
import { exportReportMatrixToPdf } from "@/features/powerBI/reportMatrixPdfExport";
import {
  ReportMatrixPdfExportDialog,
  type ReportMatrixPdfExportMode,
} from "@/features/powerBI/ReportMatrixPdfExportDialog";
import type { ReportMatrixPdfPage } from "@/features/powerBI/types/reportMatrixPdfExport.types";
import {
  buildReportMatrixFilteredView,
  canExpandCategory,
  canExpandGroup2,
  canExpandGroup3,
  canExpandTeam,
  collectReportMatrixExportMembers,
} from "@/features/powerBI/reportMatrixVisibleRows";
import type {
  ReportMatrixColumn,
  ReportMatrixRow,
  ReportMatrixTableProps,
  ReportMatrixTableFiltersState,
} from "@/features/powerBI/types/ReportMatrixTable.types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";
import { useSellersStore } from "@/stores/sellersStore";

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

function normalizeLockedTeamValue(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.toUpperCase() === "ALL") {
    return "";
  }

  return trimmed;
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
  area,
  brandLabel,
  categoryLabel = "Κατηγορία Στόχου",
  description,
  exportFileName,
  filters: filtersProp,
  group2Order,
  headerLabel,
  hideSummaryPill = false,
  leadingColumns,
  onFiltersChange,
  periodSummary,
  rows,
  sections,
  title,
}: ReportMatrixTableProps) {
  const [internalFilters, setInternalFilters] =
    useState<ReportMatrixTableFiltersState>({
      category: "",
      team: "",
      seller: "",
    });
  const filters = filtersProp ?? internalFilters;

  function updateFilters(patch: Partial<ReportMatrixTableFiltersState>) {
    const nextFilters = { ...filters, ...patch };

    if (onFiltersChange) {
      onFiltersChange(nextFilters);
      return;
    }

    setInternalFilters(nextFilters);
  }

  const {
    category: categoryFilter,
    team: teamFilter,
    seller: sellerFilter,
  } = filters;
  const lockedTeamFilter = useAuthStore((state) => {
    const userInfos = state.userInfos;
    return (
      normalizeLockedTeamValue(userInfos?.travmaTeam) ||
      normalizeLockedTeamValue(userInfos?.team) ||
      ""
    );
  });
  const userArea = useAuthStore((state) => state.userInfos?.area);
  const selectedArea = useSelectedSellerStore(
    (state) => state.selectedSeller?.area,
  );
  const matchedArea = useSellersStore((state) => state.matched?.area);
  const areaLabel =
    (area || selectedArea || matchedArea || userArea || "").trim() || "—";
  const effectiveTeamFilter = lockedTeamFilter || teamFilter;

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
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isPdfExportDialogOpen, setIsPdfExportDialogOpen] = useState(false);
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
        if (effectiveTeamFilter && teamValue !== effectiveTeamFilter) {
          return false;
        }

        return true;
      }),
    [categoryFilter, detailRows, effectiveTeamFilter],
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
    categoryFilter ||
    effectiveSellerFilter ||
    (!lockedTeamFilter && teamFilter),
  );
  const matrixView = useMemo(
    () =>
      buildReportMatrixFilteredView({
        categoryFilter,
        detailRows,
        expansion: {
          categoryKeys: expandedCategoryKeys,
          group2Keys: expandedGroup2Keys,
          group3Keys: expandedGroup3Keys,
          teamKeys: expandedTeamKeys,
        },
        group2Order,
        sellerFilter: effectiveSellerFilter,
        teamFilter: effectiveTeamFilter,
      }),
    [
      categoryFilter,
      detailRows,
      effectiveSellerFilter,
      effectiveTeamFilter,
      expandedCategoryKeys,
      expandedGroup2Keys,
      expandedGroup3Keys,
      expandedTeamKeys,
      group2Order,
    ],
  );
  const {
    bodyRows,
    filteredDetailRows,
    filteredRows,
    group2Rows,
    hasGroup2,
    totalRows,
  } = matrixView;
  const pdfExportMembers = useMemo(
    () => collectReportMatrixExportMembers(sellerOptionRows),
    [sellerOptionRows],
  );
  const pdfExportTeamLabel = lockedTeamFilter
    ? lockedTeamFilter
    : resolveFilterLabel(effectiveTeamFilter, teamOptions);
  const requiresMultiPagePdfExport = !effectiveSellerFilter;
  const expandableGroup2Keys = useMemo(
    () => bodyRows.filter(canExpandGroup2).map((row) => row.key),
    [bodyRows],
  );
  const hasExpandableRows = expandableGroup2Keys.length > 0;
  const areAllExpandableRowsExpanded =
    hasExpandableRows &&
    expandableGroup2Keys.every((key) => expandedGroup2Keys.has(key));

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
        (row.rowKind === "group2" && canExpandGroup2(row)) ||
        (row.isSellerGroup2Summary && (row.childCount ?? 0) > 1),
    );

    return measureReportMatrixCategoryColumnWidth(labels, includeChevron);
  }, [categoryLabel, filteredRows]);

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
    updateFilters({
      category: "",
      team: lockedTeamFilter,
      seller: "",
    });
    setExpandedGroup2Keys(new Set());
    setExpandedCategoryKeys(new Set());
    setExpandedGroup3Keys(new Set());
    setExpandedTeamKeys(new Set());
  }

  function toggleExpandAll() {
    if (areAllExpandableRowsExpanded) {
      setExpandedGroup2Keys(new Set());
      setExpandedCategoryKeys(new Set());
      setExpandedGroup3Keys(new Set());
      setExpandedTeamKeys(new Set());
      return;
    }

    setExpandedGroup2Keys(new Set(expandableGroup2Keys));
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
    const nextFilters: Partial<ReportMatrixTableFiltersState> = {
      category: nextCategory,
    };

    if (
      sellerFilter &&
      !sellerExistsForFilters(
        detailRows,
        sellerFilter,
        nextCategory,
        effectiveTeamFilter,
      )
    ) {
      nextFilters.seller = "";
    }

    updateFilters(nextFilters);
  }

  function handleTeamFilterChange(nextTeam: string) {
    if (lockedTeamFilter) return;

    updateFilters({
      team: nextTeam,
      seller: "",
    });
  }

  function handleSellerFilterChange(nextSeller: string) {
    if (!nextSeller) {
      updateFilters({ seller: "" });
      return;
    }

    const team =
      sellerOptionRows.find((row) => row.filterValues?.seller === nextSeller)
        ?.filterValues?.team ?? "";

    updateFilters({
      seller: nextSeller,
      ...(team ? { team } : {}),
    });
  }

  function resolveExportFileName(
    seller?: { label: string; value: string } | null,
  ) {
    const resolvedSeller =
      seller ??
      (effectiveSellerFilter
        ? {
            value: effectiveSellerFilter,
            label: resolveSellerFilterLabel(
              effectiveSellerFilter,
              sellerOptions,
            ),
          }
        : undefined);

    return getMatrixExportFileName(exportFileName, brandLabel, {
      category: categoryFilter
        ? {
            value: categoryFilter,
            label: resolveFilterLabel(categoryFilter, categoryOptions),
          }
        : undefined,
      seller: resolvedSeller,
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

  function buildPdfFilterPage({
    rows,
    sellerFilterActive,
    sellerLabel,
    sellerRows,
    teamLabel,
  }: {
    rows: ReportMatrixRow[];
    sellerFilterActive: boolean;
    sellerLabel: string;
    sellerRows: ReportMatrixRow[];
    teamLabel: string;
  }): ReportMatrixPdfPage {
    return {
      filters: {
        area: areaLabel,
        category: resolveFilterLabel(categoryFilter, categoryOptions),
        group2:
          sellerFilterActive && categoryFilter
            ? resolveSelectedSellerGroup2(sellerRows, categoryFilter)
            : undefined,
        team: teamLabel,
        seller: sellerLabel,
      },
      rows,
      sellerFilterActive,
    };
  }

  async function performPdfExport(mode?: ReportMatrixPdfExportMode) {
    if (isPdfExporting) return;

    setIsPdfExporting(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      const currentTeamLabel = pdfExportTeamLabel;
      const sharedOptions = {
        brandLabel,
        categoryLabel,
        description,
        exportFileName: resolveExportFileName(),
        headerLabel:
          typeof (headerLabel ?? brandLabel) === "string"
            ? String(headerLabel ?? brandLabel)
            : brandLabel,
        leadingColumns: resolvedLeadingColumns,
        periodSummary,
        sections,
      };

      if (effectiveSellerFilter) {
        await exportReportMatrixToPdf({
          ...sharedOptions,
          pages: [
            buildPdfFilterPage({
              rows: filteredRows,
              sellerFilterActive: true,
              sellerLabel: resolveSellerFilterLabel(
                effectiveSellerFilter,
                sellerOptions,
              ),
              sellerRows: filteredDetailRows,
              teamLabel: currentTeamLabel,
            }),
          ],
        });
        return;
      }

      if (mode === "current-view") {
        await exportReportMatrixToPdf({
          ...sharedOptions,
          exportFileName: resolveExportFileName(),
          pages: [
            buildPdfFilterPage({
              rows: filteredRows,
              sellerFilterActive: false,
              sellerLabel: resolveSellerFilterLabel("", sellerOptions),
              sellerRows: filteredDetailRows,
              teamLabel: currentTeamLabel,
            }),
          ],
        });
        return;
      }

      for (const [memberIndex, member] of pdfExportMembers.entries()) {
        if (memberIndex > 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 150);
          });
        }

        const memberView = buildReportMatrixFilteredView({
          categoryFilter,
          detailRows,
          expandAll: true,
          group2Order,
          sellerFilter: member.seller,
          teamFilter: member.team,
        });

        await exportReportMatrixToPdf({
          ...sharedOptions,
          exportFileName: resolveExportFileName({
            value: member.seller,
            label: member.sellerLabel,
          }),
          pages: [
            buildPdfFilterPage({
              rows: memberView.filteredRows,
              sellerFilterActive: true,
              sellerLabel: member.sellerLabel,
              sellerRows: memberView.filteredDetailRows,
              teamLabel: member.team
                ? resolveFilterLabel(member.team, teamOptions)
                : currentTeamLabel,
            }),
          ],
        });
      }
    } finally {
      setIsPdfExporting(false);
      setIsPdfExportDialogOpen(false);
    }
  }

  function handlePdfExportClick() {
    if (isPdfExporting || !filteredRows.length) return;

    if (requiresMultiPagePdfExport) {
      setIsPdfExportDialogOpen(true);
      return;
    }

    void performPdfExport();
  }

  function handlePdfExportConfirm(mode: ReportMatrixPdfExportMode) {
    void performPdfExport(mode);
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

    if (row.isSellerTeamSummary && columnKey === "category") {
      return content;
    }

    if (row.isSellerGroup2Summary && columnKey === "category") {
      if ((row.childCount ?? 0) <= 1) {
        return content;
      }

      const isExpanded = expandedGroup2Keys.has(row.key);

      return (
        <Button
          type="button"
          variant="ghost"
          className="report-matrix__category-toggle h-auto min-h-0 justify-start p-0 text-left whitespace-normal"
          aria-expanded={isExpanded}
          onClick={() => toggleGroup2(row.key)}
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
    const isGroup2Row = row.rowKind === "group2" && !row.isSellerGroup2Summary;
    const isGroup2Subcategory = isGroup2SubcategoryRow(
      row,
      group2Rows,
      hasGroup2,
    );

    return (
      <tr
        key={row.key}
        className={cn(
          (isGroup2Row || row.isSellerGroup2Summary) &&
            "report-matrix__row--group2",
          row.rowKind === "category" &&
            !isGroup2Subcategory &&
            "report-matrix__row--category",
          isGroup2Subcategory && "report-matrix__row--group2-subcategory",
          row.rowKind === "group3" &&
            !row.isSellerFlattened &&
            "report-matrix__row--group3",
          row.isSellerFlattened && "report-matrix__row--seller-flat",
          row.isSellerGroup2Summary &&
            "report-matrix__row--seller-group2-summary",
          row.isSellerTeamSummary && "report-matrix__row--seller-team-summary",
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
              (row.isSellerFlattened ||
                row.isSellerTeamSummary ||
                row.isSellerGroup2Summary) &&
              column.key === "category"
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
            fitContent
            label="AREA"
            options={[]}
            readOnly
            value={areaLabel}
            onChange={() => undefined}
          />
          <PowerBiTableHeaderFilter
            label={categoryLabel}
            options={categoryOptions}
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
          />
          <PowerBiTableHeaderFilter
            label="TEAM"
            options={teamOptions}
            readOnly={Boolean(lockedTeamFilter)}
            value={effectiveTeamFilter}
            onChange={handleTeamFilterChange}
          />
          <PowerBiTableHeaderFilter
            fitContent
            label="Seller name"
            options={sellerOptions}
            value={effectiveSellerFilter}
            onChange={handleSellerFilterChange}
          />
          <span className="group relative inline-flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10"
              aria-label="Reset filters"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              <AppIcon
                name="bi-arrow-counterclockwise"
                className="size-5"
                size={20}
              />
            </Button>
            <span
              role="tooltip"
              className="bg-foreground text-background pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            >
              Reset filters
            </span>
          </span>
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
              disabled={!filteredRows.length || isPdfExporting}
              onClick={handlePdfExportClick}
            >
              <PdfFileIcon className="size-5" size={20} />
              {isPdfExporting ? "PDF…" : "PDF"}
            </Button>
          </div>
        </div>
      </div>
      <ReportMatrixPdfExportDialog
        isExporting={isPdfExporting}
        open={isPdfExportDialogOpen}
        teamLabel={pdfExportTeamLabel}
        onConfirm={handlePdfExportConfirm}
        onOpenChange={setIsPdfExportDialogOpen}
      />
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
