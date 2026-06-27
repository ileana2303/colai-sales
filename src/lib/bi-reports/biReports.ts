import type { PowerBiDatasetTarget } from "@/lib/bi-reports/powerBi";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import type { ApiUserInfo } from "@/types/api/schemas";

export type BiReportSellerContext = {
  sellerCode: string;
  sellerName: string;
};

export type BiReportPowerBiTargetKey =
  | "sales"
  | "sales_year"
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
  | "amoena_trend_current_year"
  | "sellers";

const MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID =
  "e928997c-ad45-4320-a7d6-b35a8fa8e510";

const MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID =
  "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f";
const MAVROGENIS_SALES_REPORTS_LAST_YEAR_CLP_DATASET_ID =
  "5f39f3a4-1245-4510-bbb3-c20b394afd7f";

const MAVROGENIS_BBM_SALES_REPORTS_ALL = "26e3306d-333c-4383-89b1-736498c0e29e";

const MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR =
  "3703e49b-ad53-4001-8b5e-2374268d1483";
const MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_LAST_YEAR =
  "3a917ebc-e44b-4f6c-8b4a-26a76d9b6e02";

const BI_REPORT_DATASET_IDS: Record<BiReportPowerBiTargetKey, string> = {
  sales: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  sales_year: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  akrateia: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  akrateia_sales_last_year: MAVROGENIS_SALES_REPORTS_LAST_YEAR_CLP_DATASET_ID,
  akrateia_sales_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  akrateia_trend_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  bbm_sales_last_year: MAVROGENIS_BBM_SALES_REPORTS_ALL,
  bbm_sales_current_year: MAVROGENIS_BBM_SALES_REPORTS_ALL,
  bbm_trends_current_year: MAVROGENIS_BBM_SALES_REPORTS_ALL,
  coloplast_sales_2023: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  coloplast_sales_last_year: MAVROGENIS_SALES_REPORTS_LAST_YEAR_CLP_DATASET_ID,
  coloplast_sales_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  coloplast_trend_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  covidien_sales_last_year: MAVROGENIS_SALES_REPORTS_LAST_YEAR_CLP_DATASET_ID,
  covidien_sales_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  covidien_trend_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  porges_sales_last_year: MAVROGENIS_SALES_REPORTS_LAST_YEAR_CLP_DATASET_ID,
  porges_sales_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  porges_trend_current_year:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
  amoena_sales_current_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR,
  amoena_sales_last_year: MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_LAST_YEAR,
  amoena_trend_current_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR,
  sellers: MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
};

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

export function resolveBiReportPowerBiTarget(
  key: BiReportPowerBiTargetKey,
): Required<PowerBiDatasetTarget> {
  return {
    datasetId: BI_REPORT_DATASET_IDS[key],
    workspaceId: "",
  };
}

export function getUserDisplayName(userInfo: ApiUserInfo | null): string {
  return (
    [userInfo?.fname, userInfo?.lname].filter(Boolean).join(" ").trim() ||
    userInfo?.username?.trim() ||
    ""
  );
}

export function resolveBiReportSellerContext(
  userInfo: ApiUserInfo | null,
): BiReportSellerContext | null {
  const sellerCode = normalizeSellerCode(userInfo?.sellerCode);
  if (sellerCode) {
    return {
      sellerCode,
      sellerName: getUserDisplayName(userInfo),
    };
  }

  return null;
}
