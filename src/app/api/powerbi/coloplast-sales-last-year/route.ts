import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildColoplastSales2025Queries,
  normalizeColoplastSales2025Rows,
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
    const specs = buildColoplastSales2025Queries(area);

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
              `Coloplast sales 2025 ${spec.label} query failed. ${err.message}`,
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
      report: "coloplast_sales_last_year",
      year: 2025,
      area,
      records: data.flatMap(normalizeColoplastSales2025Rows),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
