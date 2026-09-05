import { create } from "zustand";

type NavigationHistoryState = {
  stack: string[];
  getPreviousPath: () => string | null;
  reset: () => void;
  syncPath: (pathname: string) => void;
};

export const useNavigationHistoryStore = create<NavigationHistoryState>(
  (set, get) => ({
    stack: [],
    syncPath: (pathname) => {
      const normalizedPath = pathname || "/";
      const stack = get().stack;
      const last = stack[stack.length - 1];

      if (last === normalizedPath) return;

      const existingIndex = stack.lastIndexOf(normalizedPath);
      if (existingIndex !== -1 && existingIndex < stack.length - 1) {
        set({ stack: stack.slice(0, existingIndex + 1) });
        return;
      }

      set({ stack: [...stack, normalizedPath] });
    },
    getPreviousPath: () => {
      const stack = get().stack;
      if (stack.length < 2) return null;
      return stack[stack.length - 2] ?? null;
    },
    reset: () => set({ stack: [] }),
  }),
);
