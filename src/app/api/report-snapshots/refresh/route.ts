import { NextResponse } from "next/server";

import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { POWERBI_NO_CACHE_HEADERS } from "@/lib/bi-reports/powerBi";
import { refreshSnapshot } from "@/lib/snapshots/snapshotRuntime";
import type { RefreshSnapshotRequest } from "@/lib/snapshots/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | RefreshSnapshotRequest
    | null;
  const pageCode = body?.pageCode?.trim() ?? "";
  const currentYear = Number(body?.currentYear);
  const compareYear = Number(body?.compareYear);
  const areaParam = body?.area?.trim() ?? "";
  const queryIds = Array.isArray(body?.queryIds)
    ? body.queryIds.map((queryId) => String(queryId).trim()).filter(Boolean)
    : undefined;

  if (
    !pageCode ||
    !Number.isInteger(currentYear) ||
    !Number.isInteger(compareYear)
  ) {
    return NextResponse.json(
      { ok: false, message: "Missing refresh input." },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const auth = await getPowerBiRouteAuthContext();
  if (!auth.ok) {
    return auth.response;
  }

  const area = areaParam || auth.reportContext.area;

  try {
    const result = await refreshSnapshot({
      area,
      pageCode,
      currentYear,
      compareYear,
      queryIds,
    });
    return NextResponse.json(
      { ok: true, fromCache: false, ...result },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh snapshot.";
    return NextResponse.json(
      { ok: false, message },
      { status: 500, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
