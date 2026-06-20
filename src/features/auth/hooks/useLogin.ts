"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { loginRequest } from "@/lib/api/auth";
import { authKeys } from "@/features/auth/queryKeys";
import { useAuthStore } from "@/stores/authStore";

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setAuthenticated(data.userInfos!);
      queryClient.setQueryData(authKeys.me(), {
        ok: true,
        authenticated: true,
        userInfos: data.userInfos,
        user: { username: data.userInfos?.username ?? "user" },
      });
    },
    onError: (error: Error) => {
      setUnauthenticated(error.message);
    },
  });
}
