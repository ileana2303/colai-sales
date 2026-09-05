import type { PowerBiExecuteQueriesResponse } from "@/lib/bi-reports/powerBi.types";
import {
  readNumber,
  readOptionalString,
  readString,
} from "@/lib/bi-reports/powerBiRowParsing";
import type { CurrentYearSalesRow } from "@/lib/bi-reports/salesRows.types";

export type { CurrentYearSalesRow };

export function normalizeCurrentYearSalesRows(
  response: PowerBiExecuteQueriesResponse,
): CurrentYearSalesRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => {
    const group3 = readOptionalString(row, "Group3");

    return {
      sellerCode: readString(row, "SellerCode"),
      group1: readString(row, "Group1"),
      group2: readString(row, "Group2"),
      ...(group3 ? { group3 } : {}),
      month: readString(row, "Month"),
      closedMonthStatus: readString(row, "ClosedMonthStatus"),
      reportCode: readString(row, "REPORT_CODE"),
      reportDesc: readString(row, "REPORT_DESC"),
      currency:
        readNumber(row, "Currency") ?? readNumber(row, "CURRENCY") ?? null,
      vcy: readNumber(row, "VCY"),
      tcy: readNumber(row, "TCY"),
    };
  });
}
