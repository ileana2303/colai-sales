import type { PowerBiExecuteQueriesResponse } from "@/lib/bi-reports/powerBi.types";
import {
  readNumber,
  readOptionalString,
  readString,
} from "@/lib/bi-reports/powerBiRowParsing";
import type { LastYearSalesRow } from "@/lib/bi-reports/salesRows.types";

export type { LastYearSalesRow };

export function normalizeLastYearSalesRows(
  response: PowerBiExecuteQueriesResponse,
): LastYearSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => {
    const group3 = readOptionalString(row, "Group3");

    return {
      sellerCode: readString(row, "SellerCode"),
      group1: readString(row, "Group1"),
      group2: readString(row, "Group2"),
      ...(group3 ? { group3 } : {}),
      month: readString(row, "Month"),
      reportCode: readString(row, "REPORT_CODE"),
      reportDesc: readString(row, "REPORT_DESC"),
      currency:
        readNumber(row, "Currency") ?? readNumber(row, "CURRENCY") ?? null,
      vly:
        readNumber(row, "VLY") ??
        readNumber(row, "VLC") ??
        readNumber(row, "VCY"),
    };
  });
}
