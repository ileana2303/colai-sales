import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import {
  AKRATEIA_CATEGORY_ORDER,
  buildAkrateiaSales2025Queries,
  normalizeAkrateiaSales2025Rows,
} from "@/lib/bi-reports/akrateia";
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
    const target = resolveBiReportPowerBiTarget("akrateia_sales_last_year");
    const tokenOptions = { amsaAccessToken: token };

    data = await Promise.all(
      buildAkrateiaSales2025Queries(area).map(async (query, index) => {
        try {
          return await executePowerBiQuery(query, target, tokenOptions);
        } catch (err) {
          const category =
            AKRATEIA_CATEGORY_ORDER[index] ?? `query ${index + 1}`;

          if (err instanceof PowerBiRequestError) {
            throw new PowerBiRequestError(
              `Akrateia sales 2025 ${category} query failed. ${err.message}`,
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
      year: 2025,
      area,
      records: data.flatMap(normalizeAkrateiaSales2025Rows),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
