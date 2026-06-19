import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  resolveBiReportPowerBiTarget,
  resolveBiReportSellerContext,
  type AkrateiaCoverSummary,
  type AkrateiaPermanentRow,
  type AkrateiaRow,
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

const monthOrder: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function buildAkrateiaQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS('Calendar'[Month], FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "CC NEW sales", [CC NEW sales], "CC REP sales", [CC REP sales], "Sales", [Sales], "CC Sales Target", [CC Sales Target], "CC % Sales Cover CM", [CC % Sales Cover CM], "CC New PERi", [CC New PERi], "CC NEW PER Target", [CC NEW PER Target], "CC NEW % PER Cover CM", [CC NEW % PER Cover CM], "CC EKTEL", [CC EKTEL], "CC Ektel Target", [CC Ektel Target], "% CC EKTEL Total PER running", [% CC EKTEL Total PER running])`;
}

function buildAkrateiaPermanentQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS('Calendar'[Month], FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "Monimoi Sales", [Monimoi Sales], "Monimoi Sales Target", [Monimoi Sales Target], "% PE Cover", [% PE Cover]) ORDER BY 'Calendar'[Month]`;
}

function buildAkrateiaCoverSummaryQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS(FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "% CC Sales Cover", [% CC Sales Cover], "% CC NEW PER Cover", [% CC NEW PER Cover], "% CC REP PER Cover", [% CC REP PER Cover], "% CC PER Cover", [% CC PER Cover])`;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMonthSortIndex(month: string): number {
  const numericPrefix = month.trim().match(/^0?([1-9]|1[0-2])\b/);
  if (numericPrefix) return Number(numericPrefix[1]) - 1;

  const monthPart = month
    .trim()
    .replace(/^\d+\s*/, "")
    .replace(".", "")
    .trim()
    .slice(0, 4)
    .toLowerCase();

  return monthOrder[monthPart] ?? 99;
}

function normalizeAkrateiaRows(
  response: PowerBiExecuteQueriesResponse,
): AkrateiaRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows
    .map((row) => ({
      month: String(row["Calendar[Month]"] ?? "").trim(),
      ccNewSales: toNullableNumber(row["[CC NEW sales]"]),
      ccRepSales: toNullableNumber(row["[CC REP sales]"]),
      sales: toNullableNumber(row["[Sales]"]),
      ccSalesTarget: toNullableNumber(row["[CC Sales Target]"]),
      ccSalesCoverCM: toNullableNumber(row["[CC % Sales Cover CM]"]),
      ccNewPeri: toNullableNumber(row["[CC New PERi]"]),
      ccNewPerTarget: toNullableNumber(row["[CC NEW PER Target]"]),
      ccNewPerCoverCM: toNullableNumber(row["[CC NEW % PER Cover CM]"]),
      ccEktel: toNullableNumber(row["[CC EKTEL]"]),
      ccEktelTarget: toNullableNumber(row["[CC Ektel Target]"]),
      ccEktelTotalPerRunning: toNullableNumber(
        row["[% CC EKTEL Total PER running]"],
      ),
    }))
    .filter((row) => row.month)
    .sort((a, b) => {
      const orderDiff = getMonthSortIndex(a.month) - getMonthSortIndex(b.month);
      if (orderDiff !== 0) return orderDiff;
      return a.month.localeCompare(b.month, "el");
    });
}

function normalizeAkrateiaPermanentRows(
  response: PowerBiExecuteQueriesResponse,
): AkrateiaPermanentRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows
    .map((row) => ({
      month: String(row["Calendar[Month]"] ?? "").trim(),
      monimoiSales: toNullableNumber(row["[Monimoi Sales]"]),
      monimoiSalesTarget: toNullableNumber(row["[Monimoi Sales Target]"]),
      peCover: toNullableNumber(row["[% PE Cover]"]),
    }))
    .filter((row) => row.month)
    .sort((a, b) => {
      const orderDiff = getMonthSortIndex(a.month) - getMonthSortIndex(b.month);
      if (orderDiff !== 0) return orderDiff;
      return a.month.localeCompare(b.month, "el");
    });
}

function normalizeAkrateiaCoverSummary(
  response: PowerBiExecuteQueriesResponse,
): AkrateiaCoverSummary | null {
  const row = response.results?.[0]?.tables?.[0]?.rows?.[0];
  if (!row) return null;

  return {
    ccSalesCover: toNullableNumber(row["[% CC Sales Cover]"]),
    ccNewPerCover: toNullableNumber(row["[% CC NEW PER Cover]"]),
    ccRepPerCover: toNullableNumber(row["[% CC REP PER Cover]"]),
    ccPerCover: toNullableNumber(row["[% CC PER Cover]"]),
  };
}

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
  const seller = resolveBiReportSellerContext(userInfo);
  if (!seller) {
    return NextResponse.json(
      { ok: false, message: "Missing seller code for authenticated user" },
      { status: 400, headers: POWERBI_NO_CACHE_HEADERS },
    );
  }

  let data: PowerBiExecuteQueriesResponse;
  let permanentData: PowerBiExecuteQueriesResponse;
  let coverSummaryData: PowerBiExecuteQueriesResponse;
  try {
    const target = resolveBiReportPowerBiTarget("akrateia");
    const tokenOptions = { amsaAccessToken: token };

    [data, permanentData, coverSummaryData] = await Promise.all([
      executePowerBiQuery(
        buildAkrateiaQuery(seller.sellerCode),
        target,
        tokenOptions,
      ),
      executePowerBiQuery(
        buildAkrateiaPermanentQuery(seller.sellerCode),
        target,
        tokenOptions,
      ),
      executePowerBiQuery(
        buildAkrateiaCoverSummaryQuery(seller.sellerCode),
        target,
        tokenOptions,
      ),
    ]);
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
      sellerCode: seller.sellerCode,
      sellerName: seller.sellerName,
      records: normalizeAkrateiaRows(data),
      permanentRecords: normalizeAkrateiaPermanentRows(permanentData),
      coverSummary: normalizeAkrateiaCoverSummary(coverSummaryData),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
