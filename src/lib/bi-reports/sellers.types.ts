export type PowerBiSellerRow = {
  sellerCode: string;
  salesPerson: string;
  team: string;
  area: string;
};

export type SellerByAreaInfo = {
  seller_code: string;
  sales_person: string;
  team: string;
};

export type SellersByAreaPayload = Record<string, SellerByAreaInfo[]>;

export type AreaSellersRowInput = {
  area: string;
  sellers: SellerByAreaInfo[];
};

export type ResolvedReportSellerContext = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
};
