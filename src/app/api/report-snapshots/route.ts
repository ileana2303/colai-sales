import { NextResponse } from "next/server";

import { ensureSnapshot } from "@/lib/snapshots/snapshotRuntime";
import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { POWERBI_NO_CACHE_HEADERS } from "@/lib/bi-reports/powerBi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageCode = url.searchParams.get("pageCode")?.trim() ?? "";
  const year = Number(url.searchParams.get("year"));
  const compareYearParam = url.searchParams.get("compareYear");
  const compareYear =
    compareYearParam == null ? year - 1 : Number(compareYearParam);
  const areaParam = url.searchParams.get("area")?.trim() ?? "";

  if (!pageCode || !Number.isInteger(year) || !Number.isInteger(compareYear)) {
    return NextResponse.json(
      { ok: false, message: "Missing pageCode or year." },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const auth = await getPowerBiRouteAuthContext();
  if (!auth.ok) {
    return auth.response;
  }

  const area = areaParam || auth.reportContext.area;

  try {
    const data = await ensureSnapshot({
      area,
      pageCode,
      year,
      compareYear,
    });
    return NextResponse.json(
      { ok: true, ...data },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load snapshot.";
    return NextResponse.json(
      { ok: false, message },
      { status: 500, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
