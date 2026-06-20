"use client";

import { useEffect } from "react";

import { useAuthMe } from "@/features/auth/hooks/useAuthMe";
import { useAuthStore } from "@/stores/authStore";

export default function AuthHydrator() {
  const status = useAuthStore((s) => s.status);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const { data, isError, isFetched } = useAuthMe(status === "unknown");

  useEffect(() => {
    if (status !== "unknown" || !isFetched) return;

    if (isError || !data?.authenticated) {
      setUnauthenticated();
      return;
    }

    if (data.userInfos) {
      setAuthenticated(data.userInfos);
    }
  }, [
    data,
    isError,
    isFetched,
    setAuthenticated,
    setUnauthenticated,
    status,
  ]);

  return null;
}
