import { parseProxyJson, API_NO_CACHE_HEADERS } from "@/lib/api/client";
import type {
  AvailableSnapshotsResponse,
  RefreshSnapshotResponse,
  SnapshotResponse,
} from "@/lib/snapshots/types";

export async function fetchReportSnapshot(input: {
  area?: string;
  pageCode: string;
  year: number;
  compareYear: number;
  snapshotDate?: string;
}) {
  const params = new URLSearchParams({
    pageCode: input.pageCode,
    year: String(input.year),
    compareYear: String(input.compareYear),
  });
  if (input.area?.trim()) {
    params.set("area", input.area.trim());
  }
  if (input.snapshotDate?.trim()) {
    params.set("snapshotDate", input.snapshotDate.trim());
  }

  const res = await fetch(`/api/report-snapshots?${params.toString()}`, {
    cache: "no-store",
    headers: API_NO_CACHE_HEADERS,
  });
  return parseProxyJson<Extract<SnapshotResponse, { ok: true }>>(
    res,
    "Failed to load report snapshot.",
  );
}

export async function fetchAvailableReportSnapshots(input: {
  pageCode: string;
  year: number;
}) {
  const params = new URLSearchParams({
    pageCode: input.pageCode,
    year: String(input.year),
  });
  const res = await fetch(
    `/api/report-snapshots/available?${params.toString()}`,
    {
      cache: "no-store",
      headers: API_NO_CACHE_HEADERS,
    },
  );
  return parseProxyJson<Extract<AvailableSnapshotsResponse, { ok: true }>>(
    res,
    "Failed to load available report snapshots.",
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
      ...API_NO_CACHE_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseProxyJson<Extract<RefreshSnapshotResponse, { ok: true }>>(
    res,
    "Failed to refresh report snapshot.",
  );
}
