"use client";

import { useQuery } from "@tanstack/react-query";

import { sellersByAreaKeys } from "@/features/sellersByArea/queryKeys";
import { ensureSellersByAreaCatalog } from "@/lib/api/sellersByArea";

/** Client-side cadence for calling ensure; server enforces the 1-month refresh TTL. */
const ENSURE_CLIENT_STALE_TIME_MS = 24 * 60 * 60 * 1000;

export function useEnsureSellersByArea(enabled = true) {
  return useQuery({
    queryKey: sellersByAreaKeys.ensure(),
    queryFn: ensureSellersByAreaCatalog,
    enabled,
    staleTime: ENSURE_CLIENT_STALE_TIME_MS,
    retry: 1,
  });
}
