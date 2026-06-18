import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "@/features/settings/settingsSlice";
import authReducer from "@/features/auth/authSlice";
import wcDiadiaksiaReducer from "@/store/wcDiadikasia/wcDiadikasiaSlice";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    auth: authReducer,
    wcDiadiaksia: wcDiadiaksiaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
