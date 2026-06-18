import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  resolveBiReportPowerBiTargetFromRequest,
  resolveBiReportSellerContext,
  type SalesPerYearCoverSummary,
  type SalesPerYearMonthlyRow,
  type SalesPerYearRow,
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

function buildSalesPerYearQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS(FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "Total Coloplast Sales", [Total Coloplast Sales], "Total CLP Target", [Total CLP Target], "Total CLP Sales Forecast", [Total CLP Sales Forecast], "% Total CLP Cover", [% Total CLP Cover], "OC PER", [OC PER], "OC PER Target", [OC PER Target], "OC PER Forecast", [OC PER Forecast], "% OC Cover", [% OC Cover], "IC PER NEW", [IC PER NEW], "IC PER Target New", [IC PER Target New], "Genadyne Sales", [Genadyne Sales], "GENADYNE Target", [GENADYNE Target Sales], "% COVER GENADYNE", [% COVER GENADYNE], "UNO Sales", [UNO Sales], "UNO Target Sales", [UNO Target Sales], "% COVER UNO", [% COVER UNO])`;
}

function buildSalesPerYearMonthlyQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS('Calendar'[Month], FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "Hospital Sales", [Hospital Sales], "Hospital Target", [Hospital Target], "HOSPITAL % Sales Cover CM", [HOSPITAL % Sales Cover CM], "Non Hospital Sales WC", [Non Hospital Sales WC], "Non Hospital Target WC", [Non Hospital Target WC], "WC % Sales Cover CM", [WC % Sales Cover CM], "Non Hospital Sales CC", [Non Hospital Sales CC], "Non Hospital Target CC", [Non Hospital Target CC], "CC NH % Sales Cover CM", [CC NH % Sales Cover CM], "Total Coloplast Sales", [Total Coloplast Sales], "Total CLP Target", [Total CLP Target], "TOTAL CLP % Sales Cover CM", [TOTAL CLP % Sales Cover CM], "Genadyne Sales", [Genadyne Sales], "GENADYNE Target Sales", [GENADYNE Target Sales], "GE % Sales Cover CM", [GE % Sales Cover CM], "UNO Sales", [UNO Sales], "UNO Target Sales", [UNO Target Sales], "% COVER UNO", [% COVER UNO]) ORDER BY 'Calendar'[Month]`;
}

function buildSalesPerYearCoverSummaryQuery(sellerCode: string): string {
  const escapedSellerCode = escapeDaxString(sellerCode);

  return `EVALUATE SUMMARIZECOLUMNS(FILTER('U Sales Person', 'U Sales Person'[SellerCode] = "${escapedSellerCode}"), "% HOSPITAL COVER ALL", [% HOSPITAL COVER ALL], "% WC COVER ALL", [% WC COVER ALL], "% CC COVER ALL", [% CC COVER ALL], "% TOTAL COVER ALL", [% TOTAL COVER ALL])`;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeSalesPerYearRows(
  response: PowerBiExecuteQueriesResponse,
): SalesPerYearRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    totalColoplastSales: toNullableNumber(row["[Total Coloplast Sales]"]),
    totalClpTarget: toNullableNumber(row["[Total CLP Target]"]),
    totalClpSalesForecast: toNullableNumber(row["[Total CLP Sales Forecast]"]),
    totalClpCover: toNullableNumber(row["[% Total CLP Cover]"]),
    ocPer: toNullableNumber(row["[OC PER]"]),
    ocPerTarget: toNullableNumber(row["[OC PER Target]"]),
    ocPerForecast: toNullableNumber(row["[OC PER Forecast]"]),
    ocCover: toNullableNumber(row["[% OC Cover]"]),
    icPerNew: toNullableNumber(row["[IC PER NEW]"]),
    icPerTargetNew: toNullableNumber(row["[IC PER Target New]"]),
    genadyneSales: toNullableNumber(row["[Genadyne Sales]"]),
    genadyneTarget: toNullableNumber(row["[GENADYNE Target]"]),
    genadyneCover: toNullableNumber(row["[% COVER GENADYNE]"]),
    unoSales: toNullableNumber(row["[UNO Sales]"]),
    unoTargetSales: toNullableNumber(row["[UNO Target Sales]"]),
    unoCover: toNullableNumber(row["[% COVER UNO]"]),
  }));
}

function normalizeSalesPerYearMonthlyRows(
  response: PowerBiExecuteQueriesResponse,
): SalesPerYearMonthlyRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows
    .map((row) => ({
      month: String(row["Calendar[Month]"] ?? "").trim(),
      hospitalSales: toNullableNumber(row["[Hospital Sales]"]),
      hospitalTarget: toNullableNumber(row["[Hospital Target]"]),
      hospitalSalesCoverCM: toNullableNumber(
        row["[HOSPITAL % Sales Cover CM]"],
      ),
      nonHospitalSalesWc: toNullableNumber(row["[Non Hospital Sales WC]"]),
      nonHospitalTargetWc: toNullableNumber(row["[Non Hospital Target WC]"]),
      wcSalesCoverCM: toNullableNumber(row["[WC % Sales Cover CM]"]),
      nonHospitalSalesCc: toNullableNumber(row["[Non Hospital Sales CC]"]),
      nonHospitalTargetCc: toNullableNumber(row["[Non Hospital Target CC]"]),
      ccNhSalesCoverCM: toNullableNumber(row["[CC NH % Sales Cover CM]"]),
      totalColoplastSales: toNullableNumber(row["[Total Coloplast Sales]"]),
      totalClpTarget: toNullableNumber(row["[Total CLP Target]"]),
      totalClpSalesCoverCM: toNullableNumber(
        row["[TOTAL CLP % Sales Cover CM]"],
      ),
      genadyneSales: toNullableNumber(row["[Genadyne Sales]"]),
      genadyneTargetSales: toNullableNumber(row["[GENADYNE Target Sales]"]),
      geSalesCoverCM: toNullableNumber(row["[GE % Sales Cover CM]"]),
      unoSales: toNullableNumber(row["[UNO Sales]"]),
      unoTargetSales: toNullableNumber(row["[UNO Target Sales]"]),
      unoCover: toNullableNumber(row["[% COVER UNO]"]),
    }))
    .filter((row) => row.month);
}

function normalizeSalesPerYearCoverSummary(
  response: PowerBiExecuteQueriesResponse,
): SalesPerYearCoverSummary | null {
  const row = response.results?.[0]?.tables?.[0]?.rows?.[0];
  if (!row) return null;

  return {
    hospitalCoverAll: toNullableNumber(row["[% HOSPITAL COVER ALL]"]),
    wcCoverAll: toNullableNumber(row["[% WC COVER ALL]"]),
    ccCoverAll: toNullableNumber(row["[% CC COVER ALL]"]),
    totalCoverAll: toNullableNumber(row["[% TOTAL COVER ALL]"]),
  };
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
  let monthlyData: PowerBiExecuteQueriesResponse;
  let coverSummaryData: PowerBiExecuteQueriesResponse;
  try {
    const target = resolveBiReportPowerBiTargetFromRequest(req, "sales_year");
    const tokenOptions = { amsaAccessToken: token };

    [data, monthlyData, coverSummaryData] = await Promise.all([
      executePowerBiQuery(
        buildSalesPerYearQuery(seller.sellerCode),
        target,
        tokenOptions,
      ),
      executePowerBiQuery(
        buildSalesPerYearMonthlyQuery(seller.sellerCode),
        target,
        tokenOptions,
      ),
      executePowerBiQuery(
        buildSalesPerYearCoverSummaryQuery(seller.sellerCode),
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
      records: normalizeSalesPerYearRows(data),
      monthlyRecords: normalizeSalesPerYearMonthlyRows(monthlyData),
      coverSummary: normalizeSalesPerYearCoverSummary(coverSummaryData),
    },
    { headers: POWERBI_NO_CACHE_HEADERS },
  );
}
