import { create } from "zustand";

import type { PowerBiSellerRow } from "@/lib/bi-reports/sellers";

export type SellersStatus = "idle" | "loading" | "ready" | "error";

type SellersState = {
  status: SellersStatus;
  records: PowerBiSellerRow[];
  matched: PowerBiSellerRow | null;
  setLoading: () => void;
  setSellers: (
    records: PowerBiSellerRow[],
    matched: PowerBiSellerRow | null,
  ) => void;
  setError: () => void;
  reset: () => void;
};

const initialState = {
  status: "idle" as SellersStatus,
  records: [] as PowerBiSellerRow[],
  matched: null as PowerBiSellerRow | null,
};

export const useSellersStore = create<SellersState>()((set) => ({
  ...initialState,
  setLoading: () => set({ status: "loading" }),
  setSellers: (records, matched) =>
    set({ status: "ready", records, matched }),
  setError: () => set({ status: "error", records: [], matched: null }),
  reset: () => set(initialState),
}));
