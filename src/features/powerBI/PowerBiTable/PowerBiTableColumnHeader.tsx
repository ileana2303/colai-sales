"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { PowerBiTableHeaderFilter } from "@/features/powerBI/PowerBiTable/PowerBiTableHeaderFilter";
import type {
  FilterOptionsByColumn,
  PowerBiTableColumn,
} from "@/features/powerBI/PowerBiTable/types";
import type { PowerBiTableSortState } from "@/features/powerBI/PowerBiTable/usePowerBiTableRows";
import { cn } from "@/lib/utils";

type PowerBiTableColumnHeaderProps<T> = {
  column: PowerBiTableColumn<T>;
  filterOption?: FilterOptionsByColumn<T>;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onToggleSort: (column: PowerBiTableColumn<T>) => void;
  sortState: PowerBiTableSortState;
};

export function PowerBiTableColumnHeader<T>({
  column,
  filterOption,
  filterValues,
  onFilterChange,
  onToggleSort,
  sortState,
}: PowerBiTableColumnHeaderProps<T>) {
  if (filterOption) {
    return (
      <PowerBiTableHeaderFilter
        label={column.header}
        options={filterOption.options}
        value={filterValues[filterOption.filter.key] ?? ""}
        onChange={(value) => onFilterChange(filterOption.filter.key, value)}
      />
    );
  }

  if (column.sortValue) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto px-0 text-muted-foreground hover:bg-transparent",
          column.align === "end" ? "justify-end" : "justify-start",
        )}
        onClick={() => onToggleSort(column)}
      >
        <span>{column.header}</span>
        <AppIcon
          name={
            sortState?.columnKey === column.key
              ? sortState.direction === "asc"
                ? "bi-sort-up"
                : "bi-sort-down"
              : "bi-arrow-down-up"
          }
          size={14}
        />
      </Button>
    );
  }

  return column.header;
}
