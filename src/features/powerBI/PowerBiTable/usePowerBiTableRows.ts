"use client";

import { useMemo } from "react";

import {
  EMPTY_FILTER_VALUES,
  type FilterOption,
  type FilterOptionsByColumn,
  type PowerBiTableColumn,
  type PowerBiTableFilter,
} from "@/features/powerBI/PowerBiTable/types";
import {
  buildExcelHtml,
  compareSortValues,
  downloadExcelFile,
  getExportFileName,
  normalizeFilterValue,
} from "@/features/powerBI/PowerBiTable/utils";
import {
  usePowerBiStore,
  type PowerBiSortState,
} from "@/stores/powerBiStore";

type UsePowerBiTableRowsOptions<T> = {
  columns: PowerBiTableColumn<T>[];
  exportFileName?: string;
  filters: PowerBiTableFilter<T>[];
  rows: T[];
  tableId?: string;
  title: string;
};

export function usePowerBiTableRows<T>({
  columns,
  exportFileName,
  filters,
  rows,
  tableId,
  title,
}: UsePowerBiTableRowsOptions<T>) {
  const setTableFilter = usePowerBiStore((s) => s.setTableFilter);
  const setTableSort = usePowerBiStore((s) => s.setTableSort);
  const resetTableUi = usePowerBiStore((s) => s.resetTableUi);
  const filterValues =
    usePowerBiStore((s) =>
      tableId ? s.tableUiById[tableId]?.filterValues : undefined,
    ) ?? EMPTY_FILTER_VALUES;
  const sortState =
    usePowerBiStore((s) =>
      tableId ? s.tableUiById[tableId]?.sortState : undefined,
    ) ?? null;

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
        } satisfies FilterOptionsByColumn<T>;
      }),
    [filters, rows],
  );

  const filterOptionsByColumnKey = useMemo(() => {
    const optionsByColumnKey = new Map<string, FilterOptionsByColumn<T>>();

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
    if (!tableId) return;
    setTableFilter(tableId, key, value);
  }

  function resetFilters() {
    if (!tableId) return;
    resetTableUi(tableId);
  }

  function toggleSort(column: PowerBiTableColumn<T>) {
    if (!column.sortValue || !tableId) return;

    setTableSort(
      tableId,
      sortState?.columnKey === column.key
        ? {
            columnKey: column.key,
            direction: sortState.direction === "asc" ? "desc" : "asc",
          }
        : { columnKey: column.key, direction: "asc" },
    );
  }

  function exportToExcel() {
    downloadExcelFile(
      buildExcelHtml(columns, visibleRows),
      getExportFileName(title, exportFileName),
    );
  }

  return {
    filterOptionsByColumnKey,
    filterValues,
    hasActiveFilters,
    resetFilters,
    exportToExcel,
    sortState,
    toggleSort,
    updateFilter,
    visibleRows,
  };
}

export type PowerBiTableSortState = PowerBiSortState | null;
