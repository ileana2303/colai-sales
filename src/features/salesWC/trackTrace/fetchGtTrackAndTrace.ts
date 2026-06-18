import { parseProxyJson } from "@/lib/api/client";
import type { GetGtTrackAndTraceSuccess } from "@/types/api";

export async function fetchGtTrackAndTrace(
  voucher: string,
): Promise<GetGtTrackAndTraceSuccess> {
  const trimmed = voucher.trim();
  const params = new URLSearchParams({ voucher: trimmed });
  const res = await fetch(`/api/gt-track-and-trace?${params.toString()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return parseProxyJson<GetGtTrackAndTraceSuccess>(
    res,
    "Failed to load tracking info",
  );
}
