"use client";

import { PowerBiTableGrid } from "@/features/powerBI/PowerBiTable/PowerBiTableGrid";
import { PowerBiTableToolbar } from "@/features/powerBI/PowerBiTable/PowerBiTableToolbar";
import type { PowerBiTableProps } from "@/features/powerBI/PowerBiTable/types";
import { usePowerBiTableRows } from "@/features/powerBI/PowerBiTable/usePowerBiTableRows";

export function PowerBiTable<T>({
  columns,
  exportFileName,
  filters = [],
  rows,
  getRowKey,
  maxHeight,
  subtitle = "Αναλυτικός πίνακας Power BI",
  title = "Power BI data",
  tableId,
}: PowerBiTableProps<T>) {
  const {
    exportToExcel,
    filterOptionsByColumnKey,
    filterValues,
    hasActiveFilters,
    resetFilters,
    sortState,
    toggleSort,
    updateFilter,
    visibleRows,
  } = usePowerBiTableRows({
    columns,
    exportFileName,
    filters,
    rows,
    tableId,
    title,
  });

  if (!rows.length) return null;

  return (
    <div className="app-card p-5">
      <PowerBiTableToolbar
        hasActiveFilters={hasActiveFilters}
        subtitle={subtitle}
        title={title}
        visibleRowCount={visibleRows.length}
        onExport={exportToExcel}
        onResetFilters={resetFilters}
      />

      <PowerBiTableGrid
        columns={columns}
        filterOptionsByColumnKey={filterOptionsByColumnKey}
        filterValues={filterValues}
        getRowKey={getRowKey}
        maxHeight={maxHeight}
        rows={visibleRows}
        sortState={sortState}
        onFilterChange={updateFilter}
        onToggleSort={toggleSort}
      />
    </div>
  );
}
