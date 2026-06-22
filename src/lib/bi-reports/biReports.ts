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
  | "akrateia_sales_2025"
  | "akrateia_sales_2026"
  | "akrateia_trend_2026"
  | "bbm_sales_2025"
  | "bbm_sales_2026"
  | "bbm_trends_2026"
  | "covidien_sales_2025"
  | "covidien_sales_2026"
  | "covidien_trend_2026"
  | "porges_sales_2025"
  | "porges_sales_2026"
  | "porges_trend_2026";

const MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID =
  "e928997c-ad45-4320-a7d6-b35a8fa8e510";
const MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID =
  "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f";
const MAVROGENIS_SALES_REPORTS_2025_CLP_DATASET_ID =
  "5f39f3a4-1245-4510-bbb3-c20b394afd7f";

const BI_REPORT_DATASET_IDS: Record<BiReportPowerBiTargetKey, string> = {
  sales: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  sales_year: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  akrateia: MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID,
  akrateia_sales_2025: MAVROGENIS_SALES_REPORTS_2025_CLP_DATASET_ID,
  akrateia_sales_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  akrateia_trend_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  bbm_sales_2025: MAVROGENIS_SALES_REPORTS_2025_CLP_DATASET_ID,
  bbm_sales_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  bbm_trends_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  covidien_sales_2025: MAVROGENIS_SALES_REPORTS_2025_CLP_DATASET_ID,
  covidien_sales_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  covidien_trend_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  porges_sales_2025: MAVROGENIS_SALES_REPORTS_2025_CLP_DATASET_ID,
  porges_sales_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
  porges_trend_2026: MAVROGENIS_SALES_REPORTS_2026_CLP_DATASET_ID,
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
