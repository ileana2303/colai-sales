import { NextResponse } from "next/server";

import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { POWERBI_NO_CACHE_HEADERS } from "@/lib/bi-reports/powerBi";
import { listAvailableSnapshots } from "@/lib/snapshots/snapshotStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageCode = url.searchParams.get("pageCode")?.trim() ?? "";
  const year = Number(url.searchParams.get("year"));

  if (!pageCode || !Number.isInteger(year)) {
    return NextResponse.json(
      { ok: false, message: "Missing pageCode or year." },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const auth = await getPowerBiRouteAuthContext();
  if (!auth.ok) return auth.response;

  const username = auth.userInfo?.username?.trim();
  if (!username) {
    return NextResponse.json(
      { ok: false, message: "Missing authenticated username." },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  try {
    const snapshots = await listAvailableSnapshots({
      area: auth.reportContext.area,
      pageCode,
      year,
      username,
    });
    return NextResponse.json(
      { ok: true, snapshots },
      { headers: POWERBI_NO_CACHE_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load snapshots.";
    return NextResponse.json(
      { ok: false, message },
      { status: 500, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }
}
