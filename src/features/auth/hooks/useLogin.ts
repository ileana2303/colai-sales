"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { loginRequest } from "@/lib/api/auth";
import { authKeys } from "@/features/auth/queryKeys";
import { toSessionUserInfo } from "@/lib/sessionUser";
import { useAuthStore } from "@/stores/authStore";

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      const sessionUser = toSessionUserInfo(data.userInfos);
      if (!sessionUser) return;

      setAuthenticated(sessionUser);
      queryClient.setQueryData(authKeys.me(), {
        ok: true,
        authenticated: true,
        userInfos: sessionUser,
        user: { username: sessionUser.username ?? "user" },
      });
    },
    onError: (error: Error) => {
      setUnauthenticated(error.message);
    },
  });
}
