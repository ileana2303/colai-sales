import { parseProxyJson } from "@/lib/api/client";
import type {
  RefreshSnapshotResponse,
  SnapshotResponse,
} from "@/lib/snapshots/types";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

export async function fetchReportSnapshot(input: {
  area?: string;
  pageCode: string;
  year: number;
  compareYear: number;
}) {
  const params = new URLSearchParams({
    pageCode: input.pageCode,
    year: String(input.year),
    compareYear: String(input.compareYear),
  });
  if (input.area?.trim()) {
    params.set("area", input.area.trim());
  }

  const res = await fetch(`/api/report-snapshots?${params.toString()}`, {
    cache: "no-store",
    headers: NO_CACHE_HEADERS,
  });
  return parseProxyJson<Extract<SnapshotResponse, { ok: true }>>(
    res,
    "Failed to load report snapshot.",
  );
}

export async function refreshReportSnapshot(input: {
  area?: string;
  pageCode: string;
  currentYear: number;
  compareYear: number;
  queryIds?: string[];
}) {
  const res = await fetch("/api/report-snapshots/refresh", {
    method: "POST",
    cache: "no-store",
    headers: {
      ...NO_CACHE_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseProxyJson<Extract<RefreshSnapshotResponse, { ok: true }>>(
    res,
    "Failed to refresh report snapshot.",
  );
}
