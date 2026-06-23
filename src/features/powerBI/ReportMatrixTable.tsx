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
  buildReportMatrixCategoryRows,
  buildReportMatrixTotalRow,
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

export type ReportMatrixSection = {
  key: string;
  title: ReactNode;
  columns: ReportMatrixColumn[];
  tone?: ReportMatrixTone;
};

export type ReportMatrixRowMetrics = {
  hasClosedMonthStatus: boolean;
  openMonthTcyByMonth: Record<string, number>;
  tcyAll: number;
  tcyClosed: number;
  vTrend: number;
  vcyAll: number;
  vcyClosed: number;
  vlc: number;
};

export type ReportMatrixRow = {
  key: string;
  category: ReactNode;
  childCount?: number;
  filterValues?: {
    category: string;
    seller: string;
    sellerLabel: string;
    team: string;
  };
  leadingValues?: Record<string, ReactNode>;
  metrics?: ReportMatrixRowMetrics;
  parentKey?: string;
  rowKind?: "category" | "detail" | "total";
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
  return value == null || value === "" ? "—" : value;
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
      title={resolvedTitle && resolvedTitle !== "—" ? resolvedTitle : undefined}
    >
      {text}
    </span>
  );
}

function canExpandCategory(row: ReportMatrixRow) {
  return row.rowKind === "category" && (row.childCount ?? 0) > 1;
}

function getLeadingValue(row: ReportMatrixRow, key: string) {
  if (key === "category") return row.category;
  return row.leadingValues?.[key];
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
  headerLabel,
  leadingColumns,
  rows,
  sections,
  title,
}: ReportMatrixTableProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [expandedCategoryKeys, setExpandedCategoryKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const cardRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const detailRows = useMemo(
    () => rows.filter((row) => !row.isTotal && row.rowKind !== "category"),
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

  const categoryRows = useMemo(
    () => buildReportMatrixCategoryRows(comparisonDetailRows),
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
  const hasExpandableCategories = expandableCategoryKeys.length > 0;
  const areAllExpandableCategoriesExpanded =
    hasExpandableCategories &&
    expandableCategoryKeys.every((key) => expandedCategoryKeys.has(key));

  const detailRowsByCategory = useMemo(() => {
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

  const filteredRows = useMemo(() => {
    const bodyRows = categoryRows.flatMap((row) => {
      const detailRows = detailRowsByCategory.get(row.key) ?? [];

      if (effectiveSellerFilter) {
        return detailRows.length ? [row, ...detailRows] : [row];
      }

      if (!canExpandCategory(row) || !expandedCategoryKeys.has(row.key)) {
        return [row];
      }

      return [row, ...detailRows];
    });
    const filteredTotal = buildReportMatrixTotalRow(comparisonDetailRows);

    return filteredTotal && !categoryFilter
      ? [...bodyRows, filteredTotal]
      : bodyRows;
  }, [
    categoryRows,
    categoryFilter,
    comparisonDetailRows,
    detailRowsByCategory,
    effectiveSellerFilter,
    expandedCategoryKeys,
  ]);

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
    setExpandedCategoryKeys(new Set());
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

  function toggleAllCategories() {
    setExpandedCategoryKeys((current) => {
      if (!expandableCategoryKeys.length) return current;

      const next = new Set(current);
      const shouldCollapse = expandableCategoryKeys.every((key) =>
        next.has(key),
      );

      for (const key of expandableCategoryKeys) {
        if (shouldCollapse) {
          next.delete(key);
        } else {
          next.add(key);
        }
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

  function renderCategoryCellContent(row: ReportMatrixRow, content: ReactNode) {
    if (row.rowKind === "category") {
      if (effectiveSellerFilter || !canExpandCategory(row)) {
        return content;
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

    if (row.rowKind === "detail") {
      return <span className="report-matrix__detail-label">{content}</span>;
    }

    return content;
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
        <div className="report-matrix-card__actions">
          {teamFilter || effectiveSellerFilter ? (
            <div className="report-matrix-card__active-filters">
              {teamFilter ? (
                <span className="report-matrix-filter-pill">
                  <span className="report-matrix-filter-pill__label">Team</span>
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
            size="icon-sm"
            className="report-matrix-card__expand-toggle"
            disabled={!hasExpandableCategories}
            aria-label={
              areAllExpandableCategoriesExpanded
                ? "Collapse all expandable rows"
                : "Expand all expandable rows"
            }
            aria-pressed={areAllExpandableCategoriesExpanded}
            title={
              areAllExpandableCategoriesExpanded
                ? "Collapse all rows"
                : "Expand all rows"
            }
            onClick={toggleAllCategories}
          >
            <AppIcon name="bi-unfold-vertical" size={16} />
          </Button>
         
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
            <AppIcon name="bi-file-earmark-excel" className="mr-1" size={14} />
            Excel
          </Button>
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
                  {section.title}
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
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.key}
                className={cn(
                  row.rowKind === "category" && "report-matrix__row--category",
                  row.rowKind === "detail" && "report-matrix__row--detail",
                  row.isTotal && "report-matrix__row--total",
                )}
              >
                {resolvedLeadingColumns.map((column, index) => {
                  const rawValue = getLeadingValue(row, column.key);
                  const title =
                    column.key === "seller"
                      ? row.filterValues?.sellerLabel
                      : getTruncationTitle(rawValue);
                  const content =
                    column.key === "category"
                      ? renderCategoryCellContent(
                          row,
                          renderTruncatedCell(rawValue, title),
                        )
                      : renderTruncatedCell(rawValue, title);
                  const className = cn(
                    index === 0
                      ? "report-matrix__category-cell"
                      : "report-matrix__dimension-cell",
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
                })}
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
