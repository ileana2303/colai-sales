"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateAuth } from "@/features/auth/authSlice";

export default function AuthHydrator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status === "unknown") {
      dispatch(hydrateAuth());
    }
  }, [dispatch, status]);

  return null;
}
