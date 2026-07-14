import {
  buildAreaCategoryTargetsQuery,
  findAreaCategoryTargetsRow,
  normalizeAreaCategoryTargetsRows,
} from "@/lib/bi-reports/areaCategoryTargets";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  executePowerBiQuery,
  getCurrentReportYear,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";
import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
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
      buildAreaCategoryTargetsQuery(),
      resolveBiReportPowerBiTarget("area_category_targets"),
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

  const records = normalizeAreaCategoryTargetsRows(data);

  return NextResponse.json(
    {
      ok: true,
      report: "area_category_targets",
      year: getCurrentReportYear(),
      area,
      record: findAreaCategoryTargetsRow(records, area),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
