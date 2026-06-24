import type { PowerBiExecuteQueriesResponse } from "@/lib/bi-reports/powerBi";

export type TrendSalesRow = {
  sellerCode: string;
  group1: string;
  group2: string;
  group3?: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vTrend: number | null;
};

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function readString(row: Record<string, unknown>, key: string): string {
  return String(row[`[${key}]`] ?? row[key] ?? "").trim();
}

function readNumber(row: Record<string, unknown>, key: string): number | null {
  return toNullableNumber(row[`[${key}]`] ?? row[key]);
}

function readOptionalString(row: Record<string, unknown>, key: string) {
  const value = readString(row, key);
  return value || undefined;
}

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
