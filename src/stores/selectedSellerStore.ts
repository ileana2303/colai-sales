"use client";

import { create } from "zustand";

import {
  clearSelectedSellerRequest,
  fetchSelectedSellerSession,
  selectSellerRequest,
  type SelectedSellerSession,
} from "@/lib/api/auth";

type SelectedSellerState = {
  hydrated: boolean;
  isAreaPickerUser: boolean;
  selectedSeller: SelectedSellerSession | null;
  hydrateFromSession: () => Promise<void>;
  selectSeller: (sellerCode: string) => Promise<SelectedSellerSession>;
  clearSelection: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  hydrated: false,
  isAreaPickerUser: false,
  selectedSeller: null as SelectedSellerSession | null,
};

export const useSelectedSellerStore = create<SelectedSellerState>()(
  (set, get) => ({
    ...initialState,
    hydrateFromSession: async () => {
      set({ hydrated: false });

      try {
        const data = await fetchSelectedSellerSession();
        set({
          hydrated: true,
          isAreaPickerUser: data.isAreaPickerUser,
          selectedSeller: data.selectedSeller,
        });
      } catch {
        set({
          hydrated: true,
          isAreaPickerUser: false,
          selectedSeller: null,
        });
      }
    },
    selectSeller: async (sellerCode) => {
      const data = await selectSellerRequest(sellerCode);
      set({
        hydrated: true,
        isAreaPickerUser: true,
        selectedSeller: data.selectedSeller,
      });
      return data.selectedSeller;
    },
    clearSelection: async () => {
      if (!get().isAreaPickerUser) return;
      await clearSelectedSellerRequest();
      set({ selectedSeller: null, hydrated: true });
    },
    reset: () => set(initialState),
  }),
);
