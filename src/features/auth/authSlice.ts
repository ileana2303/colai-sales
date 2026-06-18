import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { clearUserSessionOnLogout } from "@/store/clearUserSessionOnLogout";
import type { AppDispatch } from "@/store/store";
import type { ApiUserInfo } from "@/types/api/schemas";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  userInfos: ApiUserInfo | null;
  actingSellerCode: string | null;
  error: string | null;
};

const initialState: AuthState = {
  status: "unknown",
  userInfos: null,
  actingSellerCode: null,
  error: null,
};

export const hydrateAuth = createAsyncThunk("auth/hydrate", async () => {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const data = await res.json();
  return data as {
    authenticated: boolean;
    userInfos?: ApiUserInfo | null;
    user?: Pick<ApiUserInfo, "username">;
  };
});

export const logoutAsync = createAsyncThunk<
  boolean,
  void,
  { dispatch: AppDispatch }
>("auth/logout", async (_, { dispatch }) => {
  await fetch("/api/auth/logout", { method: "POST" });
  clearUserSessionOnLogout(dispatch);
  return true;
});

const LS_KEY = "auth";

function loadStateFromLocalStorage(): any | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as any;
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

function persistStateToLocalStorage(state: any) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode issues
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: () => loadStateFromLocalStorage() ?? initialState,
  reducers: {
    loginOk(state, action: PayloadAction<{ userInfos: ApiUserInfo }>) {
      state.status = "authenticated";
      state.userInfos = action.payload.userInfos;
      state.actingSellerCode = null;
      state.error = null;
      persistStateToLocalStorage(state);
    },
    loginFail(state, action: PayloadAction<string>) {
      state.status = "unauthenticated";
      state.userInfos = null;
      state.actingSellerCode = null;
      state.error = action.payload;
      persistStateToLocalStorage(state);
    },
    setActingSellerCode(state, action: PayloadAction<string | null>) {
      const next = action.payload?.trim() || null;
      state.actingSellerCode = next;
      persistStateToLocalStorage(state);
    },
  },
  extraReducers: (b) => {
    b.addCase(hydrateAuth.fulfilled, (state, action) => {
      if (action.payload.authenticated) {
        state.status = "authenticated";
        if (action.payload.userInfos) {
          state.userInfos = action.payload.userInfos;
        }
        persistStateToLocalStorage(state);
      } else {
        state.status = "unauthenticated";
        state.userInfos = null;
        state.actingSellerCode = null;
        persistStateToLocalStorage(state);
      }
    });
    b.addCase(hydrateAuth.rejected, (state) => {
      state.status = "unauthenticated";
      state.userInfos = null;
      state.actingSellerCode = null;
      persistStateToLocalStorage(state);
    });
    b.addCase(logoutAsync.fulfilled, (state) => {
      state.status = "unauthenticated";
      state.userInfos = null;
      state.actingSellerCode = null;
      persistStateToLocalStorage(state);
    });
  },
});

export const { loginOk, loginFail, setActingSellerCode } = authSlice.actions;
export default authSlice.reducer;
