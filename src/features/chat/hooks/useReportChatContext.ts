"use client";

import { useMemo } from "react";

import type { UseReportChatContextInput } from "@/features/chat/hooks/useReportChatContext.types";
import type { ReportChatContext } from "@/features/chat/types";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";
import { useSellersStore } from "@/stores/sellersStore";

export function useReportChatContext(
  input: UseReportChatContextInput,
): ReportChatContext {
  const {
    brandLabel,
    reportKey,
    snapshotPageCode,
    currentYear,
    previousYear,
    snapshotDate,
    viewLabel,
  } = input;

  const userArea = useAuthStore((state) => state.userInfos?.area);
  const selectedArea = useSelectedSellerStore(
    (state) => state.selectedSeller?.area,
  );
  const matchedArea = useSellersStore((state) => state.matched?.area);

  return useMemo(
    () => ({
      brandLabel,
      reportKey,
      snapshotPageCode,
      currentYear,
      previousYear,
      snapshotDate,
      viewLabel,
      area: selectedArea || matchedArea || userArea || null,
    }),
    [
      brandLabel,
      reportKey,
      snapshotPageCode,
      currentYear,
      previousYear,
      snapshotDate,
      viewLabel,
      selectedArea,
      matchedArea,
      userArea,
    ],
  );
}
