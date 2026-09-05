import type { AreaCategoryTargetsRow } from "@/lib/bi-reports/areaCategoryTargets.types";
import type { PowerBiSellerRow } from "@/lib/bi-reports/sellers.types";

export type AreaReportResponse<TRow> = {
  ok: true;
  area?: string;
  records: TRow[];
};

export type PowerBiSellersResponse = {
  ok: true;
  report: "sellers";
  area: string;
  matched: PowerBiSellerRow | null;
  records: PowerBiSellerRow[];
};

export type AreaCategoryTargetsResponse = {
  ok: true;
  report: "area_category_targets";
  year: number;
  area: string;
  record: AreaCategoryTargetsRow | null;
};
