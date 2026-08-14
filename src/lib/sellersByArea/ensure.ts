import "server-only";

import {
  buildAreaSellersRows,
  fetchPowerBiSellersCatalog,
} from "@/lib/bi-reports/sellers";
import type { PowerBiTokenOptions } from "@/lib/bi-reports/powerBi";
import {
  getAreaSellersCatalogUpdatedAt,
  readAreaSellersRows,
  replaceAreaSellersRows,
} from "@/lib/sellersByArea/store";
import type {
  AreaSellersRow,
  EnsureSellersByAreaResult,
} from "@/lib/sellersByArea/types";

/** Rolling monthly TTL for refreshing the sellers-by-area catalog from Power BI. */
export const SELLERS_BY_AREA_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type { EnsureSellersByAreaResult } from "@/lib/sellersByArea/types";

function countRows(rows: AreaSellersRow[]) {
  const areaCount = rows.length;
  const sellerCount = rows.reduce(
    (total, row) => total + (row.sellers?.length ?? 0),
    0,
  );
  return { areaCount, sellerCount };
}

export function isSellersByAreaFresh(
  updatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return now - timestamp < SELLERS_BY_AREA_TTL_MS;
}

export async function ensureSellersByArea(
  tokenOptions: PowerBiTokenOptions,
): Promise<EnsureSellersByAreaResult> {
  const existing = await readAreaSellersRows();
  const existingUpdatedAt = getAreaSellersCatalogUpdatedAt(existing);

  if (existing.length > 0 && isSellersByAreaFresh(existingUpdatedAt)) {
    return {
      refreshed: false,
      ...countRows(existing),
      updated_at: existingUpdatedAt,
    };
  }

  const records = await fetchPowerBiSellersCatalog(tokenOptions, {
    forceRefresh: true,
  });
  const rows = await replaceAreaSellersRows(buildAreaSellersRows(records));

  return {
    refreshed: true,
    ...countRows(rows),
    updated_at: getAreaSellersCatalogUpdatedAt(rows),
  };
}
