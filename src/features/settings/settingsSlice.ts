import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

export interface SettingsState {
  theme: ThemeMode;
}

const initialState: SettingsState = {
  theme: "light",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
  },
});

export const { setTheme, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
