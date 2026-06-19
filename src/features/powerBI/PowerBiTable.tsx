"use client";

import { useMemo, useState, type ReactNode } from "react";

export type PowerBiTableColumn<T> = {
  key: string;
  header: string;
  align?: "start" | "end";
  exportValue?: (row: T, index: number) => string | number | null | undefined;
  render: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
};

export type PowerBiTableFilter<T> = {
  columnKey?: string;
  key: string;
  label: string;
  getValue: (row: T) => string | null | undefined;
};

type PowerBiTableProps<T> = {
  columns: PowerBiTableColumn<T>[];
  exportFileName?: string;
  filters?: PowerBiTableFilter<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => string;
  maxHeight?: number;
  subtitle?: string;
  title?: string;
};

type SortDirection = "asc" | "desc";

type SortState = {
  columnKey: string;
  direction: SortDirection;
};

type FilterOption = {
  value: string;
  label: string;
};

function normalizeFilterValue(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
) {
  if ((a == null || a === "") && (b == null || b === "")) return 0;
  if (a == null || a === "") return 1;
  if (b == null || b === "") return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), "el", {
    numeric: true,
    sensitivity: "base",
  });
}

function renderExportValue<T>(
  column: PowerBiTableColumn<T>,
  row: T,
  index: number,
) {
  const value = column.exportValue?.(row, index);
  if (value != null) return String(value);

  const rendered = column.render(row, index);
  return typeof rendered === "string" || typeof rendered === "number"
    ? String(rendered)
    : "";
}

function escapeExcelCell(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildExcelHtml<T>(columns: PowerBiTableColumn<T>[], rows: T[]) {
  const headerCells = columns
    .map((column) => `<th>${escapeExcelCell(column.header)}</th>`)
    .join("");
  const bodyRows = rows
    .map((row, rowIndex) => {
      const cells = columns
        .map(
          (column) =>
            `<td>${escapeExcelCell(renderExportValue(column, row, rowIndex))}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

function getExportFileName(title: string, exportFileName?: string) {
  const base = (exportFileName || title || "powerbi-data")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "powerbi-data"}.xls`;
}

function PowerBiTableHeaderFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const title = selectedOption
    ? `${label}: ${selectedOption.label}`
    : `${label}: Όλα`;

  return (
    <label className="d-inline-block">
      <span className="visually-hidden">{title}</span>
      <select
        aria-label={title}
        className="form-select form-select-sm rounded-pill bg-body-tertiary border-secondary-subtle fw-semibold"
        title={title}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{label}: Όλα</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {label}: {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PowerBiTable<T>({
  columns,
  exportFileName,
  filters = [],
  rows,
  getRowKey,
  maxHeight = 520,
  subtitle = "Αναλυτικός πίνακας Power BI",
  title = "Power BI data",
}: PowerBiTableProps<T>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortState, setSortState] = useState<SortState | null>(null);

  const filterOptions = useMemo(
    () =>
      filters.map((filter) => {
        const optionsByValue = new Map<string, FilterOption>();

        rows.forEach((row) => {
          const value = normalizeFilterValue(filter.getValue(row));
          if (!value) return;
          optionsByValue.set(value, { value, label: value });
        });

        return {
          filter,
          options: Array.from(optionsByValue.values()).sort((a, b) =>
            a.label.localeCompare(b.label, "el", {
              numeric: true,
              sensitivity: "base",
            }),
          ),
        };
      }),
    [filters, rows],
  );

  const filterOptionsByColumnKey = useMemo(() => {
    const optionsByColumnKey = new Map<
      string,
      (typeof filterOptions)[number]
    >();

    filterOptions.forEach((item) => {
      optionsByColumnKey.set(item.filter.columnKey ?? item.filter.key, item);
    });

    return optionsByColumnKey;
  }, [filterOptions]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        filters.every((filter) => {
          const selectedValue = filterValues[filter.key];
          if (!selectedValue) return true;
          return normalizeFilterValue(filter.getValue(row)) === selectedValue;
        }),
      ),
    [filterValues, filters, rows],
  );

  const visibleRows = useMemo(() => {
    if (!sortState) return filteredRows;

    const column = columns.find((item) => item.key === sortState.columnKey);
    if (!column?.sortValue) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const result = compareSortValues(
        column.sortValue?.(a),
        column.sortValue?.(b),
      );
      return sortState.direction === "asc" ? result : -result;
    });
  }, [columns, filteredRows, sortState]);

  const hasActiveFilters = useMemo(
    () => Object.values(filterValues).some(Boolean),
    [filterValues],
  );

  function updateFilter(key: string, value: string) {
    setFilterValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetFilters() {
    setFilterValues({});
  }

  function toggleSort(column: PowerBiTableColumn<T>) {
    if (!column.sortValue) return;

    setSortState((current) =>
      current?.columnKey === column.key
        ? {
            columnKey: column.key,
            direction: current.direction === "asc" ? "desc" : "asc",
          }
        : { columnKey: column.key, direction: "asc" },
    );
  }

  function exportToExcel() {
    const html = buildExcelHtml(columns, visibleRows);
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getExportFileName(title, exportFileName);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderColumnHeader(column: PowerBiTableColumn<T>) {
    const filterOption = filterOptionsByColumnKey.get(column.key);

    if (filterOption) {
      return (
        <PowerBiTableHeaderFilter
          label={column.header}
          options={filterOption.options}
          value={filterValues[filterOption.filter.key] ?? ""}
          onChange={(value) => updateFilter(filterOption.filter.key, value)}
        />
      );
    }

    if (column.sortValue) {
      return (
        <button
          type="button"
          className={`btn btn-sm border-0 p-0 text-${column.align ?? "start"} text-secondary d-inline-flex align-items-center gap-1`}
          onClick={() => toggleSort(column)}
        >
          <span>{column.header}</span>
          <i
            className={`bi ${
              sortState?.columnKey === column.key
                ? sortState.direction === "asc"
                  ? "bi-sort-up"
                  : "bi-sort-down"
                : "bi-arrow-down-up"
            }`}
            aria-hidden
          />
        </button>
      );
    }

    return column.header;
  }

  if (!rows.length) return null;

  return (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="fw-semibold">{title}</div>
          <div className="small text-secondary mt-1">{subtitle}</div>
        </div>
        <div className="d-flex align-items-center flex-shrink-0 gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!visibleRows.length}
            onClick={exportToExcel}
          >
            <i className="bi bi-file-earmark-excel me-1" aria-hidden />
            Excel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={!hasActiveFilters}
            onClick={resetFilters}
          >
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden />
            Reset filters
          </button>
        </div>
      </div>

      <div
        className="table-responsive mt-3"
        style={{ maxHeight, overflow: "auto" }}
      >
        <table className="table-sm mb-0 table align-middle">
          <thead>
            <tr className="small text-secondary">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`bg-body position-sticky top-0 text-${column.align ?? "start"}`}
                >
                  {renderColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={getRowKey?.(row, rowIndex) ?? rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`text-${column.align ?? "start"} text-nowrap`}
                    >
                      {column.render(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="text-secondary py-3 text-center"
                  colSpan={columns.length}
                >
                  Δεν βρέθηκαν γραμμές με τα επιλεγμένα φίλτρα.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
