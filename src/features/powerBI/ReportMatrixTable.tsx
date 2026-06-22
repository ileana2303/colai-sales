"use client";

import { useMemo, useState, type ReactNode } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { PowerBiTableHeaderFilter } from "@/features/powerBI/PowerBiTable/PowerBiTableHeaderFilter";
import type { FilterOption } from "@/features/powerBI/PowerBiTable/types";
import { exportReportMatrixToExcel } from "@/features/powerBI/reportMatrixExport";

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

export type ReportMatrixRow = {
  key: string;
  category: ReactNode;
  filterValues?: {
    category: string;
    seller: string;
    sellerLabel: string;
    team: string;
  };
  leadingValues?: Record<string, ReactNode>;
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
  leadingColumns?: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  title?: string;
};

function cn(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getAlignClass(align: ReportMatrixColumn["align"]) {
  if (align === "left") return "report-matrix__cell--left";
  if (align === "center") return "report-matrix__cell--center";
  return "report-matrix__cell--right";
}

function renderValue(value: ReactNode) {
  return value == null || value === "" ? "—" : value;
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

export function ReportMatrixTable({
  brandLabel,
  caption,
  categoryLabel = "Κατηγορία Στόχου",
  description,
  exportFileName,
  leadingColumns,
  rows,
  sections,
  title,
}: ReportMatrixTableProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  const dataRows = useMemo(
    () => rows.filter((row) => !row.isTotal),
    [rows],
  );
  const totalRow = useMemo(() => rows.find((row) => row.isTotal), [rows]);

  const categoryOptions = useMemo(
    () =>
      buildFilterOptions(
        dataRows,
        (row) => row.filterValues?.category ?? String(row.category ?? ""),
      ),
    [dataRows],
  );
  const teamOptions = useMemo(
    () =>
      buildFilterOptions(
        dataRows,
        (row) => row.filterValues?.team ?? String(row.leadingValues?.team ?? ""),
      ),
    [dataRows],
  );
  const sellerOptions = useMemo(
    () =>
      buildFilterOptions(
        dataRows,
        (row) => row.filterValues?.seller ?? "",
        (row) => row.filterValues?.sellerLabel ?? "",
      ),
    [dataRows],
  );

  const hasActiveFilters = Boolean(categoryFilter || teamFilter || sellerFilter);

  const filteredRows = useMemo(() => {
    const filteredData = dataRows.filter((row) => {
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
      if (sellerFilter && sellerValue !== sellerFilter) {
        return false;
      }
      return true;
    });

    if (!hasActiveFilters && totalRow) {
      return [...filteredData, totalRow];
    }

    return filteredData;
  }, [
    categoryFilter,
    dataRows,
    hasActiveFilters,
    sellerFilter,
    teamFilter,
    totalRow,
  ]);

  function resetFilters() {
    setCategoryFilter("");
    setTeamFilter("");
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
      rows: filteredRows.filter((row) => !row.isTotal),
      sections,
    });
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

  const columns = sections.flatMap((section) =>
    section.columns.map((column, index) => ({
      ...column,
      isSectionStart: index === 0,
      sectionKey: section.key,
      sectionTone: section.tone,
    })),
  );

  return (
    <section className="app-card report-matrix-card">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters}
            onClick={resetFilters}
          >
            <AppIcon name="bi-arrow-counterclockwise" className="mr-1" size={14} />
            Reset filters
          </Button>
        </div>
      </div>

      <div className="report-matrix__viewport">
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
                {brandLabel}
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
                      onChange={setCategoryFilter}
                    />
                  ) : column.key === "team" ? (
                    <PowerBiTableHeaderFilter
                      label={
                        typeof column.label === "string" ? column.label : "Team"
                      }
                      options={teamOptions}
                      value={teamFilter}
                      onChange={setTeamFilter}
                    />
                  ) : column.key === "seller" ? (
                    <PowerBiTableHeaderFilter
                      label={
                        typeof column.label === "string"
                          ? column.label
                          : "Seller"
                      }
                      options={sellerOptions}
                      value={sellerFilter}
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
                className={cn(row.isTotal && "report-matrix__row--total")}
              >
                {resolvedLeadingColumns.map((column, index) => {
                  const content = renderValue(getLeadingValue(row, column.key));
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
                    >
                      {content}
                    </th>
                  ) : (
                    <td key={column.key} className={className} style={style}>
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
