"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logoutRequest } from "@/lib/api/auth";
import { authKeys } from "@/features/auth/queryKeys";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { clearUserSessionLocalStorage } from "@/lib/clearUserSession";
import { useAuthStore } from "@/stores/authStore";

export function useLogout() {
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearUserSessionLocalStorage();
      reset();
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: powerBiKeys.all });
    },
  });
}
