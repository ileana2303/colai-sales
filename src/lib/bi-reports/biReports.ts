import type { PowerBiDatasetTarget } from "@/lib/bi-reports/powerBi.types";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import type { ApiUserInfo } from "@/types/api/schemas";
import type {
  BiReportPowerBiTargetKey,
  BiReportSellerContext,
} from "@/lib/bi-reports/biReports.types";

export type {
  AkrateiaCoverSummary,
  AkrateiaPermanentRow,
  AkrateiaResponse,
  AkrateiaRow,
  BiReportPowerBiTargetKey,
  BiReportSellerContext,
  MonthlySalesRow,
  ReportTile,
  SalesPerMonthResponse,
  SalesPerYearCoverSummary,
  SalesPerYearMonthlyRow,
  SalesPerYearResponse,
  SalesPerYearRow,
} from "@/lib/bi-reports/biReports.types";

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
  area_category_targets:
    MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
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
  amoena_sales_no_currency_current_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR,
  amoena_sales_last_year: MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_LAST_YEAR,
  amoena_sales_no_currency_last_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_LAST_YEAR,
  amoena_trend_current_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR,
  amoena_trend_no_currency_current_year:
    MAVROGENIS_AMOENA_ABBOTT_SALES_REPORTS_CURRENT_TREND_YEAR,
  sellers: MAVROGENIS_SALES_REPORTS_CURRENT_YEAR_CLP_DATASET_ID,
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
