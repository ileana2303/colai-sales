import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  buildColoplastSales2026Queries,
  normalizeColoplastSales2026Rows,
} from "@/lib/bi-reports/coloplast";
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

  let data: PowerBiExecuteQueriesResponse[];
  try {
    const tokenOptions = { amsaAccessToken: token };
    const specs = buildColoplastSales2026Queries(area);

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
              `Coloplast sales 2026 ${spec.label} query failed. ${err.message}`,
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
      report: "coloplast_sales_current_year",
      year: 2026,
      area,
      records: data.flatMap(normalizeColoplastSales2026Rows),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
