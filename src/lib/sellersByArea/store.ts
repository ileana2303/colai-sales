import "server-only";

import type { AreaSellersRowInput } from "@/lib/bi-reports/sellers";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { AreaSellersRow } from "@/lib/sellersByArea/types";

export type { AreaSellersRow } from "@/lib/sellersByArea/types";

export async function replaceAreaSellersRows(
  rows: AreaSellersRowInput[],
): Promise<AreaSellersRow[]> {
  const supabase = createSupabaseAdminClient();
  const updatedAt = new Date().toISOString();
  const nextAreas = new Set(rows.map((row) => row.area));

  const payload = rows.map((row) => ({
    area: row.area,
    sellers: row.sellers,
    updated_at: updatedAt,
  }));

  if (payload.length > 0) {
    const { error: upsertError } = await supabase
      .from("area_sellers")
      .upsert(payload, { onConflict: "area" });

    if (upsertError) {
      throw new Error(`Failed to upsert area_sellers: ${upsertError.message}`);
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("area_sellers")
    .select("area");

  if (existingError) {
    throw new Error(
      `Failed to list area_sellers after upsert: ${existingError.message}`,
    );
  }

  const areasToDelete = (existing ?? [])
    .map((row) => String(row.area ?? "").trim())
    .filter((area) => area && !nextAreas.has(area));

  if (areasToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("area_sellers")
      .delete()
      .in("area", areasToDelete);

    if (deleteError) {
      throw new Error(
        `Failed to delete stale area_sellers rows: ${deleteError.message}`,
      );
    }
  }

  return readAreaSellersRows();
}

export async function readAreaSellersRows(): Promise<AreaSellersRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("area_sellers")
    .select("area, sellers, updated_at")
    .order("area", { ascending: true });

  if (error) {
    throw new Error(`Failed to read area_sellers: ${error.message}`);
  }

  return (data as AreaSellersRow[] | null) ?? [];
}

export function getAreaSellersCatalogUpdatedAt(
  rows: AreaSellersRow[],
): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const timestamp = new Date(row.updated_at).getTime();
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp > latestMs) {
      latestMs = timestamp;
      latest = row.updated_at;
    }
  }

  return latest;
}
