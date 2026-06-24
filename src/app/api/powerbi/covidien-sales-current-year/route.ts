import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildCovidienSalesQuery,
  normalizeCovidienSalesRows,
} from "@/lib/bi-reports/covidien";
import {
  executePowerBiQuery,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getPowerBiRouteAuthContext();
  if (!auth.ok) {
    return auth.response;
  }

  const { token, reportContext } = auth;
  const area = reportContext.area;

  let data: PowerBiExecuteQueriesResponse;
  try {
    data = await executePowerBiQuery(
      buildCovidienSalesQuery(area),
      resolveBiReportPowerBiTarget("covidien_sales_current_year"),
      { amsaAccessToken: token },
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
      report: "covidien_sales_current_year",
      year: 2026,
      area,
      records: normalizeCovidienSalesRows(data),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
