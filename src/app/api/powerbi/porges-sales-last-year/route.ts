import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildPorgesSalesLastYearQuery,
  normalizePorgesSales2025Rows,
} from "@/lib/bi-reports/porges";
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
      buildPorgesSalesLastYearQuery(area),
      resolveBiReportPowerBiTarget("porges_sales_last_year"),
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
      report: "porges_sales_last_year",
      year: 2025,
      area,
      records: normalizePorgesSales2025Rows(data),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
