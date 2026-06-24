import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildCovidienTrendQuery,
  normalizeCovidienTrendRows,
} from "@/lib/bi-reports/covidien";
import {
  executePowerBiQuery,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const area = userInfo?.area?.trim();
  if (!area) {
    return NextResponse.json(
      { ok: false, message: "Missing area for authenticated user" },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  let data: PowerBiExecuteQueriesResponse;
  try {
    data = await executePowerBiQuery(
      buildCovidienTrendQuery(area),
      resolveBiReportPowerBiTarget("covidien_trend_current_year"),
      { amsaAccessToken: token },
      { includeNulls: false },
    );
  } catch (err) {
    const status = err instanceof PowerBiRequestError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "Power BI request failed";

    return NextResponse.json(
      { ok: false, message },
      { status, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      report: "covidien_trend_current_year",
      year: 2026,
      area,
      records: normalizeCovidienTrendRows(data),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
