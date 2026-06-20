"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PowerBiTableColumnHeader } from "@/features/powerBI/PowerBiTable/PowerBiTableColumnHeader";
import type {
  FilterOptionsByColumn,
  PowerBiTableColumn,
} from "@/features/powerBI/PowerBiTable/types";
import type { PowerBiTableSortState } from "@/features/powerBI/PowerBiTable/usePowerBiTableRows";
import { cn } from "@/lib/utils";

type PowerBiTableGridProps<T> = {
  columns: PowerBiTableColumn<T>[];
  filterOptionsByColumnKey: Map<string, FilterOptionsByColumn<T>>;
  filterValues: Record<string, string>;
  getRowKey?: (row: T, index: number) => string;
  maxHeight?: number;
  onFilterChange: (key: string, value: string) => void;
  onToggleSort: (column: PowerBiTableColumn<T>) => void;
  rows: T[];
  sortState: PowerBiTableSortState;
};

export function PowerBiTableGrid<T>({
  columns,
  filterOptionsByColumnKey,
  filterValues,
  getRowKey,
  maxHeight,
  onFilterChange,
  onToggleSort,
  rows,
  sortState,
}: PowerBiTableGridProps<T>) {
  return (
    <div
      className="app-table-viewport mt-4"
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Table>
        <TableHeader>
          <TableRow className="text-muted-foreground hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                  className={cn(
                    "sticky top-0 z-10 bg-background align-top",
                    column.align === "end" && "text-right",
                    filterOptionsByColumnKey.has(column.key) && "min-w-[7rem]",
                  )}
              >
                <PowerBiTableColumnHeader
                  column={column}
                  filterOption={filterOptionsByColumnKey.get(column.key)}
                  filterValues={filterValues}
                  sortState={sortState}
                  onFilterChange={onFilterChange}
                  onToggleSort={onToggleSort}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <TableRow key={getRowKey?.(row, rowIndex) ?? rowIndex}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={column.align === "end" ? "text-right" : undefined}
                  >
                    {column.render(row, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground py-3 text-center"
              >
                Δεν βρέθηκαν γραμμές με τα επιλεγμένα φίλτρα.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
