"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchReportSnapshot } from "@/lib/api/snapshots";
import { powerBiKeys } from "@/features/powerBI/queryKeys";

export function useEnsureReportSnapshot(input: {
  area?: string;
  pageCode: string | null | undefined;
  year: number;
  compareYear: number;
  enabled?: boolean;
}) {
  const enabled =
    (input.enabled ?? true) &&
    Boolean(input.pageCode) &&
    Number.isInteger(input.year) &&
    Number.isInteger(input.compareYear);

  return useQuery({
    queryKey: powerBiKeys.reportSnapshot(
      input.area ?? "",
      input.pageCode ?? "",
      input.year,
      input.compareYear,
    ),
    queryFn: () =>
      fetchReportSnapshot({
        area: input.area,
        pageCode: input.pageCode!,
        year: input.year,
        compareYear: input.compareYear,
      }),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
