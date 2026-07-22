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
  computeSnapshotFields,
  getPeriodMeta,
  todayIsoDate,
} from "@/lib/snapshots/rowUtils";
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

  const recordGroups = await Promise.all(
    triples.map(async (triple) => {
      const [currentRows, previousRows, trendRows] = await Promise.all([
        executeReportQuery(token, triple.VCYTCY, input),
        executeReportQuery(token, triple.VLY, input),
        executeReportQuery(token, triple.VTREND, input),
      ]);
      const joined = enrichSnapshotRowsWithSellers(
        joinTriptych(currentRows, previousRows, trendRows),
        sellersCatalog,
      );
      const period = getPeriodMeta(joined);

      return joined.map((row) => ({
        username: user?.username ?? "user",
        area: input.area,
        year: input.currentYear,
        closed_period_label: period.closedPeriodLabel,
        closed_months_count: period.closedMonthsCount,
        last_closed_month: period.lastClosedMonth,
        open_months_count: period.openMonths,
        report_query_id: triple.VCYTCY.id,
        report_page: triple.VCYTCY.report_page,
        report_code: triple.VCYTCY.report_code,
        report_desc: triple.VCYTCY.report_desc,
        page_code: triple.VCYTCY.page_code,
        workbook_id: triple.VCYTCY.dataset_id,
        workbook_description: triple.VCYTCY.report_page_desc,
        seller_code: row.sellerCode,
        seller_name: row.sellerName,
        team: row.team,
        group1: row.group1,
        group2: row.group2,
        group3: row.group3,
        month: row.month,
        closed_month_status: row.closedMonthStatus,
        currency: triple.VCYTCY.currency,
        pbi_query_calc_01: row.pbi_query_calc_01,
        pbi_query_calc_02: row.pbi_query_calc_02,
        pbi_query_calc_03: row.pbi_query_calc_03,
        pbi_query_calc_04: row.pbi_query_calc_04,
        ...computeSnapshotFields(
          row.pbi_query_calc_01,
          row.pbi_query_calc_02,
          row.pbi_query_calc_03,
          row.pbi_query_calc_04,
          period.openMonths,
        ),
      }));
    }),
  );
  const records = recordGroups.flat();

  if (!records.length) {
    throw new Error("Power BI returned no rows; the existing snapshot was kept.");
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

    if (!isSnapshotFresh(refreshed.snapshot?.snapshot_date, today)) {
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
