import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  AKRATEIA_CATEGORY_ORDER,
  buildAkrateiaSalesLastYearQueries,
  normalizeAkrateiaSalesLastYearRows,
} from "@/lib/bi-reports/akrateia";
import {
  getPreviousReportYear,
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
    const target = resolveBiReportPowerBiTarget("akrateia_sales_last_year");
    const tokenOptions = { amsaAccessToken: token };

    data = await Promise.all(
      buildAkrateiaSalesLastYearQueries(area).map(async (query, index) => {
        try {
          return await executePowerBiQuery(query, target, tokenOptions);
        } catch (err) {
          const category =
            AKRATEIA_CATEGORY_ORDER[index] ?? `query ${index + 1}`;

          if (err instanceof PowerBiRequestError) {
            throw new PowerBiRequestError(
              `Akrateia sales ${getPreviousReportYear()} ${category} query failed. ${err.message}`,
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
      report: "akrateia_sales_last_year",
      year: getPreviousReportYear(),
      area,
      records: data.flatMap(normalizeAkrateiaSalesLastYearRows),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
