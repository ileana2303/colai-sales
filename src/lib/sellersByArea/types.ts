import type { SellerByAreaInfo } from "@/lib/bi-reports/sellers";

export type AreaSellersRow = {
  area: string;
  sellers: SellerByAreaInfo[];
  updated_at: string;
};

export type EnsureSellersByAreaResult = {
  refreshed: boolean;
  areaCount: number;
  sellerCount: number;
  updated_at: string | null;
};

export type EnsureSellersByAreaResponse = EnsureSellersByAreaResult & {
  ok: true;
};
