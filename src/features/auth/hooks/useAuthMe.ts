"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuthMe } from "@/lib/api/auth";
import { authKeys } from "@/features/auth/queryKeys";

export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchAuthMe,
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
