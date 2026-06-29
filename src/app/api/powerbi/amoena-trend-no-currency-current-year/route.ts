import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildAmoenaTrendNoCurrencyCurrentYearQuery,
  normalizeAmoenaTrendRows,
} from "@/lib/bi-reports/amoena";
import {
  getCurrentReportYear,
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
      buildAmoenaTrendNoCurrencyCurrentYearQuery(area),
      resolveBiReportPowerBiTarget("amoena_trend_no_currency_current_year"),
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
      report: "amoena_trend_no_currency_current_year",
      year: getCurrentReportYear(),
      area,
      records: normalizeAmoenaTrendRows(data),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
