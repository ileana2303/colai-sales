import {
  AKRATEIA_CATEGORY_ORDER,
  AKRATEIA_GROUP2_ORDER,
} from "@/lib/bi-reports/akrateia";
import {
  AMOENA_PERISTATIKA_CATEGORY_ORDER,
  AMOENA_SALES_CATEGORY_ORDER,
} from "@/lib/bi-reports/amoena";
import {
  COLOPLAST_CATEGORY_ORDER,
  COLOPLAST_GROUP2_ORDER,
} from "@/lib/bi-reports/coloplast";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";
import { REPORT_SNAPSHOT_PAGE_CODES } from "@/lib/snapshots/pageAvailability";
import type {
  PowerBiReportMatrixPageProps,
  PowerBiTabbedReportMatrixPageProps,
} from "@/features/powerBI/types/PowerBiReportMatrixPage.types";

const AREA_MATRIX_PAGE_CONFIG = {
  covidien: {
    brandLabel: "COVIDIEN",
    emptyMessage: "Δεν βρέθηκαν Covidien στοιχεία για το area του login.",
    fallbackError: "Failed to load Covidien matrix",
    reportKey: "covidien",
    snapshotPageCode: REPORT_SNAPSHOT_PAGE_CODES.covidien,
    currentSalesPath: "/api/powerbi/covidien-sales-current-year",
    previousSalesPath: "/api/powerbi/covidien-sales-last-year",
    trendPath: "/api/powerbi/covidien-trend-current-year",
  },
  porges: {
    brandLabel: "PORGES",
    emptyMessage: "Δεν βρέθηκαν Porges στοιχεία για το area του login.",
    fallbackError: "Failed to load Porges matrix",
    reportKey: "porges",
    snapshotPageCode: REPORT_SNAPSHOT_PAGE_CODES.porges,
    currentSalesPath: "/api/powerbi/porges-sales-current-year",
    previousSalesPath: "/api/powerbi/porges-sales-last-year",
    trendPath: "/api/powerbi/porges-trend-current-year",
  },
  bbm: {
    brandLabel: "BAUSCH & LOMB",
    emptyMessage: "Δεν βρέθηκαν BAUSCH & LOMB στοιχεία για το area του login.",
    fallbackError: "Failed to load BAUSCH & LOMB matrix",
    reportKey: "bbm",
    snapshotPageCode: REPORT_SNAPSHOT_PAGE_CODES.bbm,
    currentSalesPath: "/api/powerbi/bbm-sales-current-year",
    previousSalesPath: "/api/powerbi/bbm-sales-last-year",
    trendPath: "/api/powerbi/bbm-trends-current-year",
  },
  coloplast: {
    brandLabel: "COLOPLAST",
    emptyMessage: "Δεν βρέθηκαν Coloplast στοιχεία για το area του login.",
    fallbackError: "Failed to load Coloplast matrix",
    reportKey: "coloplast",
    snapshotPageCode: REPORT_SNAPSHOT_PAGE_CODES.coloplast,
    currentSalesPath: "/api/powerbi/coloplast-sales-current-year",
    previousSalesPath: "/api/powerbi/coloplast-sales-last-year",
    trendPath: "/api/powerbi/coloplast-trend-current-year",
    categoryOrder: COLOPLAST_CATEGORY_ORDER,
    group2Order: COLOPLAST_GROUP2_ORDER,
  },
  akrateia: {
    brandLabel: "AKRATEIA",
    emptyMessage: "Δεν βρέθηκαν Akrateia στοιχεία για το area του login.",
    fallbackError: "Failed to load Akrateia matrix",
    reportKey: "akrateia",
    snapshotPageCode: REPORT_SNAPSHOT_PAGE_CODES.akrateia,
    currentSalesPath: "/api/powerbi/akrateia-sales-current-year",
    previousSalesPath: "/api/powerbi/akrateia-sales-last-year",
    trendPath: "/api/powerbi/akrateia-trend-current-year",
    categoryOrder: AKRATEIA_CATEGORY_ORDER,
    group2Order: AKRATEIA_GROUP2_ORDER,
  },
};

export type AreaMatrixBrand = keyof typeof AREA_MATRIX_PAGE_CONFIG;

export function getAreaMatrixPageProps(
  brand: AreaMatrixBrand,
): PowerBiReportMatrixPageProps {
  const config = AREA_MATRIX_PAGE_CONFIG[brand];

  return {
    ...config,
    currentYear: getCurrentReportYear(),
    previousYear: getPreviousReportYear(),
  };
}

export function getAmoenaTabbedMatrixPageProps(): PowerBiTabbedReportMatrixPageProps {
  const currentYear = getCurrentReportYear();
  const previousYear = getPreviousReportYear();
  const snapshotPageCode = REPORT_SNAPSHOT_PAGE_CODES.amoena;
  const emptyMessage = "Δεν βρέθηκαν AMOENA στοιχεία για το area του login.";
  const fallbackError = "Failed to load AMOENA matrix";

  return {
    brandLabel: "AMOENA",
    tabs: [
      {
        key: "sales",
        label: "SALES (€)",
        view: {
          brandLabel: "AMOENA",
          categoryOrder: AMOENA_SALES_CATEGORY_ORDER,
          currentSalesPath: "/api/powerbi/amoena-sales-current-year",
          currentYear,
          emptyMessage,
          exportFileName: "amoena-sales",
          fallbackError,
          headerLabel: "SALES",
          previousSalesPath: "/api/powerbi/amoena-sales-last-year",
          previousYear,
          reportKey: "amoena-sales",
          snapshotCurrency: 1,
          snapshotPageCode,
          trendPath: "/api/powerbi/amoena-trend-current-year",
        },
      },
      {
        key: "peristatika",
        label: "ΠΕΡΙΣΤΑΤΙΚΑ",
        view: {
          brandLabel: "AMOENA",
          categoryOrder: AMOENA_PERISTATIKA_CATEGORY_ORDER,
          currentSalesPath:
            "/api/powerbi/amoena-sales-no-currency-current-year",
          currentYear,
          emptyMessage,
          exportFileName: "amoena-peristatika",
          fallbackError,
          headerLabel: "ΠΕΡΙΣΤΑΤΙΚΑ",
          previousSalesPath: "/api/powerbi/amoena-sales-no-currency-last-year",
          previousYear,
          reportKey: "amoena-peristatika",
          snapshotCurrency: 0,
          snapshotPageCode,
          trendPath: "/api/powerbi/amoena-trend-no-currency-current-year",
        },
      },
    ],
  };
}
