import { cookieName } from "@/lib/auth";
import { resolveBiReportPowerBiTargetFromRequest } from "@/lib/bi-reports/biReports";
import {
  buildCovidienSalesQuery,
  getCovidienReportArea,
  normalizeCovidienSalesRows,
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

export async function GET(req: Request) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  let data: PowerBiExecuteQueriesResponse;
  try {
    data = await executePowerBiQuery(
      buildCovidienSalesQuery(),
      resolveBiReportPowerBiTargetFromRequest(req, "covidien_sales_2025"),
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
      report: "covidien_sales_2025",
      year: 2025,
      area: getCovidienReportArea(),
      records: normalizeCovidienSalesRows(data),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
