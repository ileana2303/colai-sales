import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildColoplastTrend2026Queries,
  normalizeColoplastTrend2026Rows,
} from "@/lib/bi-reports/coloplast";
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

  let data: PowerBiExecuteQueriesResponse[];
  try {
    const tokenOptions = { amsaAccessToken: token };
    const specs = buildColoplastTrend2026Queries(area);

    data = await Promise.all(
      specs.map(async (spec) => {
        try {
          return await executePowerBiQuery(
            spec.query,
            resolveBiReportPowerBiTarget(spec.targetKey),
            tokenOptions,
          );
        } catch (err) {
          if (err instanceof PowerBiRequestError) {
            throw new PowerBiRequestError(
              `Coloplast trend 2026 ${spec.label} query failed. ${err.message}`,
              err.status,
            );
          }

          throw err;
        }
      }),
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
      report: "coloplast_trend_current_year",
      year: 2026,
      area,
      records: data.flatMap(normalizeColoplastTrend2026Rows),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
