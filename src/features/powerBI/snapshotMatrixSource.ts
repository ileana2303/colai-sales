import type { PowerBiMatrixSourceRow } from "@/features/powerBI/reportMatrixData";
import type { SnapshotRow } from "@/lib/snapshots/types";

export type SnapshotMatrixSource = {
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
};

function toText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: string | null | undefined) {
  return toText(value).toLocaleUpperCase("el-GR");
}

/** Mirrors the group2 → group1 → group3 → team → seller aggregation key used by buildReportMatrixRows. */
function getTrendDedupeKey(row: SnapshotRow) {
  return [
    row.group2,
    row.group1,
    row.group3,
    row.team,
    row.seller_code || row.seller_name || "",
  ]
    .map(normalizeKeyPart)
    .join("|");
}

/**
 * Filters the sales_snapshots rows for a given page down to the subset that
 * corresponds to a single UI view, when a page_code stores more than one
 * business view (e.g. AMOENA "SALES" vs "ΠΕΡΙΣΤΑΤΙΚΑ" share page_code
 * "amoena-reports" but are distinguished by the currency flag on each row).
 */
export function filterSnapshotRowsByCurrency(
  rows: SnapshotRow[],
  currency: 0 | 1 | undefined,
): SnapshotRow[] {
  if (currency == null) return rows;
  return rows.filter((row) => (row.currency ?? null) === currency);
}

/**
 * Rebuilds the three PowerBiMatrixSourceRow arrays (current/previous/trend)
 * that buildReportMatrixRows expects, from the already-joined sales_snapshots
 * rows. Each snapshot row already carries VCY/TCY (pbi_query_calc_01/02) for
 * its own month, VLY (pbi_query_calc_03) for the same month a year prior, and
 * VTREND (pbi_query_calc_04) broadcast across every month of the same
 * seller/group combination - so VTREND is de-duplicated per aggregate key to
 * avoid summing the same trend value once per month.
 */
export function mapSnapshotRowsToMatrixSource(
  rows: SnapshotRow[],
): SnapshotMatrixSource {
  const currentRows: PowerBiMatrixSourceRow[] = [];
  const previousRows: PowerBiMatrixSourceRow[] = [];
  const trendRowsByKey = new Map<string, PowerBiMatrixSourceRow>();

  for (const row of rows) {
    const base: Pick<
      PowerBiMatrixSourceRow,
      "group1" | "group2" | "group3" | "team" | "sellerCode" | "sellerName" | "currency"
    > = {
      group1: row.group1,
      group2: row.group2,
      group3: row.group3,
      team: row.team,
      sellerCode: row.seller_code,
      sellerName: row.seller_name,
      currency: row.currency,
    };
    const month = row.month != null ? String(row.month) : null;

    currentRows.push({
      ...base,
      month,
      closedMonthStatus: row.closed_month_status,
      tcy: row.pbi_query_calc_02,
      vcy: row.pbi_query_calc_01,
    });

    previousRows.push({
      ...base,
      month,
      vly: row.pbi_query_calc_03,
    });

    if (row.pbi_query_calc_04 != null) {
      const key = getTrendDedupeKey(row);
      if (!trendRowsByKey.has(key)) {
        trendRowsByKey.set(key, {
          ...base,
          vTrend: row.pbi_query_calc_04,
        });
      }
    }
  }

  return {
    currentRows,
    previousRows,
    trendRows: [...trendRowsByKey.values()],
  };
}

export function getSnapshotHeaderLabel(rows: SnapshotRow[]) {
  const labels = new Set(
    rows.map((row) => row.group2?.trim() ?? "").filter(Boolean),
  );

  return labels.size === 1 ? [...labels][0]! : "";
}
