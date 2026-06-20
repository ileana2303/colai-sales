import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ApiUserInfo } from "@/types/api/schemas";

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  userInfos: ApiUserInfo | null;
  error: string | null;
  setAuthenticated: (userInfos: ApiUserInfo) => void;
  setUnauthenticated: (error?: string | null) => void;
  reset: () => void;
};

const initialState = {
  status: "unknown" as AuthStatus,
  userInfos: null,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setAuthenticated: (userInfos) =>
        set({ status: "authenticated", userInfos, error: null }),
      setUnauthenticated: (error = null) =>
        set({ status: "unauthenticated", userInfos: null, error }),
      reset: () => set(initialState),
    }),
    {
      name: "auth",
      partialize: (state) => ({
        status: state.status,
        userInfos: state.userInfos,
        error: state.error,
      }),
    },
  ),
);
