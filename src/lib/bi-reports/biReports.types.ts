export type BiReportSellerContext = {
  sellerCode: string;
  sellerName: string;
};

export type BiReportPowerBiTargetKey =
  | "sales"
  | "sales_year"
  | "area_category_targets"
  | "akrateia"
  | "akrateia_sales_last_year"
  | "akrateia_sales_current_year"
  | "akrateia_trend_current_year"
  | "bbm_sales_last_year"
  | "bbm_sales_current_year"
  | "bbm_trends_current_year"
  | "coloplast_sales_2023"
  | "coloplast_sales_last_year"
  | "coloplast_sales_current_year"
  | "coloplast_trend_current_year"
  | "covidien_sales_last_year"
  | "covidien_sales_current_year"
  | "covidien_trend_current_year"
  | "porges_sales_last_year"
  | "porges_sales_current_year"
  | "porges_trend_current_year"
  | "amoena_sales_last_year"
  | "amoena_sales_current_year"
  | "amoena_sales_no_currency_last_year"
  | "amoena_sales_no_currency_current_year"
  | "amoena_trend_current_year"
  | "amoena_trend_no_currency_current_year"
  | "sellers";

export type MonthlySalesRow = {
  sellerCode: string;
  sellerName: string;
  month: string;
  sales: number;
};

export type AkrateiaRow = {
  month: string;
  ccNewSales: number | null;
  ccRepSales: number | null;
  sales: number | null;
  ccSalesTarget: number | null;
  ccSalesCoverCM: number | null;
  ccNewPeri: number | null;
  ccNewPerTarget: number | null;
  ccNewPerCoverCM: number | null;
  ccEktel: number | null;
  ccEktelTarget: number | null;
  ccEktelTotalPerRunning: number | null;
};

export type AkrateiaPermanentRow = {
  month: string;
  monimoiSales: number | null;
  monimoiSalesTarget: number | null;
  peCover: number | null;
};

export type AkrateiaCoverSummary = {
  ccSalesCover: number | null;
  ccNewPerCover: number | null;
  ccRepPerCover: number | null;
  ccPerCover: number | null;
};

export type SalesPerYearRow = {
  totalColoplastSales: number | null;
  totalClpTarget: number | null;
  totalClpSalesForecast: number | null;
  totalClpCover: number | null;
  ocPer: number | null;
  ocPerTarget: number | null;
  ocPerForecast: number | null;
  ocCover: number | null;
  icPerNew: number | null;
  icPerTargetNew: number | null;
  genadyneSales: number | null;
  genadyneTarget: number | null;
  genadyneCover: number | null;
  unoSales: number | null;
  unoTargetSales: number | null;
  unoCover: number | null;
};

export type SalesPerYearMonthlyRow = {
  month: string;
  hospitalSales: number | null;
  hospitalTarget: number | null;
  hospitalSalesCoverCM: number | null;
  nonHospitalSalesWc: number | null;
  nonHospitalTargetWc: number | null;
  wcSalesCoverCM: number | null;
  nonHospitalSalesCc: number | null;
  nonHospitalTargetCc: number | null;
  ccNhSalesCoverCM: number | null;
  totalColoplastSales: number | null;
  totalClpTarget: number | null;
  totalClpSalesCoverCM: number | null;
  genadyneSales: number | null;
  genadyneTargetSales: number | null;
  geSalesCoverCM: number | null;
  unoSales: number | null;
  unoTargetSales: number | null;
  unoCover: number | null;
};

export type SalesPerYearCoverSummary = {
  hospitalCoverAll: number | null;
  wcCoverAll: number | null;
  ccCoverAll: number | null;
  totalCoverAll: number | null;
};

export type ReportTile = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  href: string;
};

export type SalesPerMonthResponse = {
  ok: true;
  sellerCode: string;
  sellerName: string;
  records: MonthlySalesRow[];
};

export type AkrateiaResponse = {
  ok: true;
  sellerCode: string;
  sellerName: string;
  records: AkrateiaRow[];
  permanentRecords: AkrateiaPermanentRow[];
  coverSummary: AkrateiaCoverSummary | null;
};

export type SalesPerYearResponse = {
  ok: true;
  sellerCode: string;
  sellerName: string;
  records: SalesPerYearRow[];
  monthlyRecords: SalesPerYearMonthlyRow[];
  coverSummary: SalesPerYearCoverSummary | null;
};
