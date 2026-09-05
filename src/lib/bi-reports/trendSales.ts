import type { PowerBiExecuteQueriesResponse } from "@/lib/bi-reports/powerBi.types";
import {
  readNumber,
  readOptionalString,
  readString,
} from "@/lib/bi-reports/powerBiRowParsing";
import type { TrendSalesRow } from "@/lib/bi-reports/salesRows.types";

export type { TrendSalesRow };

export function normalizeTrendSalesRows(
  response: PowerBiExecuteQueriesResponse,
): TrendSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => {
    const group3 = readOptionalString(row, "Group3");

    return {
      sellerCode: readString(row, "SellerCode"),
      group1: readString(row, "Group1"),
      group2: readString(row, "Group2"),
      ...(group3 ? { group3 } : {}),
      reportCode: readString(row, "REPORT_CODE"),
      reportDesc: readString(row, "REPORT_DESC"),
      currency:
        readNumber(row, "Currency") ?? readNumber(row, "CURRENCY") ?? null,
      vTrend: readNumber(row, "VTrend") ?? readNumber(row, "VTREND"),
    };
  });
}
