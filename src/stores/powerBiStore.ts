import { create } from "zustand";

export type PowerBiSortDirection = "asc" | "desc";

export type PowerBiSortState = {
  columnKey: string;
  direction: PowerBiSortDirection;
};

export type PowerBiTableUiState = {
  filterValues: Record<string, string>;
  sortState: PowerBiSortState | null;
};

const emptyTableUi: PowerBiTableUiState = {
  filterValues: {},
  sortState: null,
};

type PowerBiStore = {
  tableUiById: Record<string, PowerBiTableUiState>;
  getTableUi: (tableId: string) => PowerBiTableUiState;
  setTableFilter: (tableId: string, key: string, value: string) => void;
  setTableSort: (tableId: string, sortState: PowerBiSortState | null) => void;
  resetTableUi: (tableId: string) => void;
  resetAllTableUi: () => void;
};

export const usePowerBiStore = create<PowerBiStore>((set, get) => ({
  tableUiById: {},
  getTableUi: (tableId) => get().tableUiById[tableId] ?? emptyTableUi,
  setTableFilter: (tableId, key, value) =>
    set((state) => {
      const current = state.tableUiById[tableId] ?? emptyTableUi;
      return {
        tableUiById: {
          ...state.tableUiById,
          [tableId]: {
            ...current,
            filterValues: {
              ...current.filterValues,
              [key]: value,
            },
          },
        },
      };
    }),
  setTableSort: (tableId, sortState) =>
    set((state) => {
      const current = state.tableUiById[tableId] ?? emptyTableUi;
      return {
        tableUiById: {
          ...state.tableUiById,
          [tableId]: {
            ...current,
            sortState,
          },
        },
      };
    }),
  resetTableUi: (tableId) =>
    set((state) => {
      const next = { ...state.tableUiById };
      delete next[tableId];
      return { tableUiById: next };
    }),
  resetAllTableUi: () => set({ tableUiById: {} }),
}));
