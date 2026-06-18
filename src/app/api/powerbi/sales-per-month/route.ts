import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  resolveBiReportPowerBiTargetFromRequest,
  resolveBiReportSellerContext,
  type MonthlySalesRow,
} from "@/lib/bi-reports/biReports";
import {
  escapeDaxString,
  executePowerBiQuery,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
  type PowerBiExecuteQueriesResponse,
} from "@/lib/bi-reports/powerBi";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildSalesPerMonthQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS('U Sales Person'[SellerCode], 'U Sales Person'[Πωλητής], 'Calendar'[Month], FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "Sales", 'Dax measures'[Sales])`;
}

function normalizePowerBiRows(
  response: PowerBiExecuteQueriesResponse,
  fallback: { sellerCode: string; sellerName: string },
): MonthlySalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => {
    const sellerCode =
      String(row["U Sales Person[SellerCode]"] ?? fallback.sellerCode).trim() ||
      fallback.sellerCode;
    const sellerName =
      String(row["U Sales Person[Πωλητής]"] ?? fallback.sellerName).trim() ||
      fallback.sellerName;
    const month = String(row["Calendar[Month]"] ?? "").trim();
    const sales = Number(row["[Sales]"] ?? 0);

    return {
      sellerCode,
      sellerName,
      month,
      sales: Number.isFinite(sales) ? sales : 0,
    };
  });
}

export async function GET(req: Request) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  const userInfo = decodeUserInfoCookie(jar.get(userCookieName)?.value);
  const seller = resolveBiReportSellerContext(userInfo);
  if (!seller) {
    return NextResponse.json(
      { ok: false, message: "Missing seller code for authenticated user" },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  let data: PowerBiExecuteQueriesResponse;
  try {
    data = await executePowerBiQuery(
      buildSalesPerMonthQuery(seller.sellerCode),
      resolveBiReportPowerBiTargetFromRequest(req, "sales"),
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

  const records = normalizePowerBiRows(data, seller);

  return NextResponse.json(
    {
      ok: true,
      sellerCode: seller.sellerCode,
      sellerName: records[0]?.sellerName || seller.sellerName,
      records,
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
