export type CurrentYearSalesRow = {
  sellerCode: string;
  group1: string;
  group2: string;
  group3?: string;
  month: string;
  closedMonthStatus: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vcy: number | null;
  tcy: number | null;
};

export type LastYearSalesRow = {
  sellerCode: string;
  group1: string;
  group2: string;
  group3?: string;
  month: string;
  reportCode: string;
  reportDesc: string;
  currency: number | null;
  vly: number | null;
};

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
