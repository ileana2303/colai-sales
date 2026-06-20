import type { ReactNode } from "react";

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

export type PowerBiTableProps<T> = {
  columns: PowerBiTableColumn<T>[];
  exportFileName?: string;
  filters?: PowerBiTableFilter<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => string;
  maxHeight?: number;
  subtitle?: string;
  title?: string;
  tableId?: string;
};

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterOptionsByColumn<T> = {
  filter: PowerBiTableFilter<T>;
  options: FilterOption[];
};

export const EMPTY_FILTER_VALUES: Record<string, string> = {};
export const ALL_FILTER_VALUE = "__all__";
