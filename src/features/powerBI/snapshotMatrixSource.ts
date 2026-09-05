import type { PowerBiMatrixSourceRow } from "@/features/powerBI/types/reportMatrixData.types";
import type { SnapshotMatrixSource } from "@/features/powerBI/types/snapshotMatrixSource.types";
import type {
  ReportMatrixRow,
  ReportMatrixTone,
} from "@/features/powerBI/types/ReportMatrixTable.types";
import type {
  JoinedSnapshotSourceRow,
  SnapshotRow,
} from "@/lib/snapshots/types";

export type { SnapshotMatrixSource };

function toText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: string | null | undefined) {
  return toText(value).toLocaleUpperCase("el-GR");
}

/** Mirrors the group2 → group1 → group3 → team → seller aggregation key used by buildReportMatrixRows. */
function getTrendDedupeKey(row: Pick<
  JoinedSnapshotSourceRow,
  "group1" | "group2" | "group3" | "sellerCode" | "sellerName" | "team"
>) {
  return [
    row.group2,
    row.group1,
    row.group3,
    row.team,
    row.sellerCode || row.sellerName || "",
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
 * Converts the joined Power BI triptych to the source shape used for the
 * one-time matrix calculation performed during snapshot refresh.
 */
export function mapJoinedSnapshotRowsToMatrixSource(
  rows: JoinedSnapshotSourceRow[],
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
      sellerCode: row.sellerCode,
      sellerName: row.sellerName,
      currency: row.currency,
    };
    const month = row.month != null ? String(row.month) : null;

    currentRows.push({
      ...base,
      month,
      closedMonthStatus: row.closedMonthStatus,
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

/**
 * Hydrates final seller rows straight from sales_snapshots. Their displayed
 * values and raw matrix metrics were both materialized during refresh, so no
 * seller-level calculation is repeated in the browser.
 */
export function mapSnapshotRowsToMatrixRows(
  rows: SnapshotRow[],
): ReportMatrixRow[] {
  return rows
    .filter((row) => row.row_kind === "detail")
    .map((row) => {
      const sellerLabel = row.seller_name?.trim() || "-";

      return {
        key: row.row_key,
        category: row.group1 || "-",
        childCount: row.child_count ?? undefined,
        filterValues: {
          category: row.group1 || "-",
          group2: row.group2 || "",
          group3: row.group3 || undefined,
          seller: `${row.seller_code ?? ""}|${row.seller_name ?? ""}`,
          sellerLabel,
          team: row.team || "",
        },
        leadingValues: {
          seller: sellerLabel,
          team: row.team || "-",
        },
        metrics: {
          currency: row.currency,
          hasClosedMonthStatus: row.has_closed_month_status,
          openMonthTcyByMonth: row.open_month_tcy_by_month ?? {},
          tcyAll: row.current_target,
          tcyClosed: row.previous_target,
          vTrend: row.current_trend,
          vcyAll: row.current_result,
          vcyClosed: row.previous_result,
          vlc: row.year_result ?? 0,
          vlcAll: row.previous_year_result_all,
        },
        parentKey: row.parent_key ?? undefined,
        rowKind: "detail",
        values: row.display_values,
        cellTones: row.cell_tones as Record<string, ReportMatrixTone> | undefined,
        isTotal: false,
      };
    });
}
