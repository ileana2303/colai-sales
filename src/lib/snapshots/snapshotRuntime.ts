import "server-only";

import {
  buildAreaCategoryTargetsQuery,
  findAreaCategoryTargetsRow,
  normalizeAreaCategoryTargetsRows,
} from "@/lib/bi-reports/areaCategoryTargets";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import { executePowerBiQuery } from "@/lib/bi-reports/powerBi";
import { fetchPowerBiSellersCatalog } from "@/lib/bi-reports/sellers";
import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import {
  buildReportMatrixRows,
  getReportMatrixFinalValues,
} from "@/features/powerBI/reportMatrixData";
import { enrichSnapshotRowsWithSellers } from "@/lib/snapshots/enrichSellers";
import { isReportPageAvailableForArea } from "@/lib/snapshots/pageAvailability";
import { executeReportQuery } from "@/lib/snapshots/powerBiExecute";
import {
  describeIncompleteQueryGroups,
  groupReportQueries,
  selectQueryTriplesByDataset,
} from "@/lib/snapshots/queryGrouping";
import { listReportQueries } from "@/lib/snapshots/reportQueryCatalog";
import { isSnapshotFresh } from "@/lib/snapshots/snapshotFreshness";
import {
  insertSnapshotRows,
  readLatestSnapshot,
  replaceTodaySnapshot,
} from "@/lib/snapshots/snapshotStore";
import {
  getPeriodMeta,
  todayIsoDate,
} from "@/lib/snapshots/rowUtils";
import { mapJoinedSnapshotRowsToMatrixSource } from "@/features/powerBI/snapshotMatrixSource";
import { joinTriptych } from "@/lib/snapshots/triptych";
import type {
  EnsureSnapshotRequest,
  EnsureSnapshotResult,
  RefreshSnapshotRequest,
  RefreshSnapshotResult,
} from "@/lib/snapshots/types";
import { cookies } from "next/headers";

export { listReportQueries } from "@/lib/snapshots/reportQueryCatalog";
export { readLatestSnapshot } from "@/lib/snapshots/snapshotStore";

const inFlightRefreshes = new Map<string, Promise<RefreshSnapshotResult>>();

async function requireAmsaSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) throw new Error("Not authenticated.");

  return {
    token,
    user: decodeUserInfoCookie(jar.get(userCookieName)?.value),
  };
}

async function fetchAreaCategoryTargetsForArea(
  amsaAccessToken: string,
  area: string,
) {
  const response = await executePowerBiQuery(
    buildAreaCategoryTargetsQuery(),
    resolveBiReportPowerBiTarget("area_category_targets"),
    { amsaAccessToken },
  );
  const records = normalizeAreaCategoryTargetsRows(response);
  return findAreaCategoryTargetsRow(records, area);
}

function getRefreshKey(input: RefreshSnapshotRequest) {
  return [
    input.area,
    input.pageCode,
    input.currentYear,
    input.compareYear,
    [...(input.queryIds ?? [])].sort().join(","),
  ].join("::");
}

function serializeDisplayValues(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, String(value ?? "")]),
  );
}

async function performRefreshSnapshot(
  input: RefreshSnapshotRequest,
): Promise<RefreshSnapshotResult> {
  const { token, user } = await requireAmsaSession();
  const categoryTargets = await fetchAreaCategoryTargetsForArea(
    token,
    input.area,
  );
  if (!isReportPageAvailableForArea(categoryTargets, input.pageCode)) {
    throw new Error(
      `Report page ${input.pageCode} is not available for area ${input.area}.`,
    );
  }

  const queriesResult = await listReportQueries();
  const pageQueries = queriesResult.queries.filter(
    (query) => query.page_code === input.pageCode,
  );
  const grouped = groupReportQueries(pageQueries);

  if (!grouped.complete.length) {
    const details = describeIncompleteQueryGroups(grouped.incomplete);
    throw new Error(
      details
        ? `No complete VCYTCY/VLY/VTREND query groups found. ${details}`
        : `No active report queries found for page ${input.pageCode}.`,
    );
  }

  const triples = selectQueryTriplesByDataset(
    grouped.complete,
    input.queryIds,
  );

  if (!triples.length) {
    throw new Error(
      `No complete report groups contain the selected dataset IDs: ${(input.queryIds ?? []).join(", ")}.`,
    );
  }

  const snapshotDate = todayIsoDate();
  const sellersCatalog = await fetchPowerBiSellersCatalog({
    amsaAccessToken: token,
  });

  const joinedGroups = await Promise.all(
    triples.map(async (triple) => {
      const [currentRows, previousRows, trendRows] = await Promise.all([
        executeReportQuery(token, triple.VCYTCY, input),
        executeReportQuery(token, triple.VLY, input),
        executeReportQuery(token, triple.VTREND, input),
      ]);
      const joined = enrichSnapshotRowsWithSellers(
        joinTriptych(currentRows, previousRows, trendRows),
        sellersCatalog,
      ).map((row) => ({ ...row, currency: triple.VCYTCY.currency }));

      return { joined, query: triple.VCYTCY };
    }),
  );
  const joined = joinedGroups.flatMap((group) => group.joined);

  if (!joined.length) {
    throw new Error("Power BI returned no rows; the existing snapshot was kept.");
  }

  const period = getPeriodMeta(joined);
  const matrixSource = mapJoinedSnapshotRowsToMatrixSource(joined);
  const matrixRows = buildReportMatrixRows({
    currentRows: matrixSource.currentRows,
    previousRows: matrixSource.previousRows,
    trendRows: matrixSource.trendRows,
    sellersCatalog,
  });
  const query = joinedGroups[0]!.query;
  const records = matrixRows.flatMap((row) => {
    if (row.rowKind !== "detail" || !row.metrics || !row.filterValues) {
      return [];
    }

    const finalValues = getReportMatrixFinalValues(row.metrics, {
      group2: row.filterValues.group2,
      isTotal: false,
      rowKind: row.rowKind,
    });

    return [
      {
        snapshot_date: snapshotDate,
        username: user?.username ?? "user",
        area: input.area,
        is_active: true,
        closed_period_label: period.closedPeriodLabel,
        closed_months_count: period.closedMonthsCount,
        last_closed_month: period.lastClosedMonth,
        open_months_count: period.openMonths,
        year: input.currentYear,
        report_query_id: query.id,
        report_page: query.report_page,
        report_code: "MATRIX",
        report_desc: "Final calculated seller matrix values",
        page_code: input.pageCode,
        workbook_id: query.dataset_id,
        workbook_description: query.report_page_desc,
        seller_code: row.filterValues.seller.split("|")[0] || null,
        seller_name: row.filterValues.seller.split("|")[1] || null,
        team: row.filterValues.team || null,
        group1: row.filterValues.category || null,
        group2: row.filterValues.group2 || null,
        group3: row.filterValues.group3 || null,
        currency: row.metrics.currency,
        calculation_version: "matrix-v1",
        row_kind: row.rowKind,
        row_key: row.key,
        parent_key: row.parentKey ?? null,
        child_count: row.childCount ?? null,
        is_total: false,
        has_closed_month_status: row.metrics.hasClosedMonthStatus,
        open_month_tcy_by_month: row.metrics.openMonthTcyByMonth,
        previous_target: finalValues.previousTarget,
        previous_result: finalValues.previousResult,
        previous_cover: finalValues.previousCover,
        previous_difference: finalValues.previousDifference,
        year_result: finalValues.yearResult,
        year_comparison: finalValues.yearComparison,
        year_difference: finalValues.yearDifference,
        previous_year_result_all: finalValues.yearResultAll,
        current_target: finalValues.currentTarget,
        current_result: finalValues.currentResult,
        current_trend: finalValues.currentTrend,
        current_cover: finalValues.currentCover,
        current_difference: finalValues.currentDifference,
        monthly_target: finalValues.monthlyTarget,
        extra_monthly_target: finalValues.extraMonthlyTarget,
        new_monthly_target: finalValues.newMonthlyTarget,
        display_values: serializeDisplayValues(row.values),
        cell_tones: row.cellTones ?? null,
      },
    ];
  });

  if (!records.length) {
    throw new Error(
      "Power BI returned no seller matrix rows; the existing snapshot was kept.",
    );
  }

  await replaceTodaySnapshot({
    area: input.area,
    pageCode: input.pageCode,
    snapshotDate,
  });
  const rowCount = await insertSnapshotRows(records);

  return { rowCount, snapshotDate };
}

export async function refreshSnapshot(input: RefreshSnapshotRequest) {
  const key = getRefreshKey(input);
  const existing = inFlightRefreshes.get(key);
  if (existing) return existing;

  const refresh = performRefreshSnapshot(input);
  inFlightRefreshes.set(key, refresh);

  try {
    return await refresh;
  } finally {
    if (inFlightRefreshes.get(key) === refresh) {
      inFlightRefreshes.delete(key);
    }
  }
}

export async function ensureSnapshot(
  input: EnsureSnapshotRequest,
): Promise<EnsureSnapshotResult> {
  const cached = await readLatestSnapshot(input);
  const today = todayIsoDate();

  if (isSnapshotFresh(cached.snapshot?.snapshot_date, today)) {
    return {
      ...cached,
      fromCache: true,
      isStale: false,
      refreshAttempted: false,
    };
  }

  try {
    await refreshSnapshot({
      area: input.area,
      pageCode: input.pageCode,
      currentYear: input.year,
      compareYear: input.compareYear,
    });
    const refreshed = await readLatestSnapshot(input);

    if (refreshed.snapshot?.snapshot_date !== today) {
      throw new Error(
        "Power BI refresh completed without creating today's snapshot.",
      );
    }

    return {
      ...refreshed,
      fromCache: false,
      isStale: false,
      refreshAttempted: true,
    };
  } catch (error) {
    if (!cached.snapshot) throw error;

    const message =
      error instanceof Error ? error.message : "Power BI refresh failed.";
    return {
      ...cached,
      fromCache: true,
      isStale: true,
      refreshAttempted: true,
      warning: `Showing snapshot from ${cached.snapshot.snapshot_date}. Refresh failed: ${message}`,
    };
  }
}
