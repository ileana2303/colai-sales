"use client";

import { PowerBiTabbedReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  AMOENA_PERISTATIKA_CATEGORY_ORDER,
  AMOENA_SALES_CATEGORY_ORDER,
} from "@/lib/bi-reports/amoena";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";
import { REPORT_SNAPSHOT_PAGE_CODES } from "@/lib/snapshots/pageAvailability";

const emptyMessage =
  "Δεν βρέθηκαν AMOENA στοιχεία για το area του login.";
const fallbackError = "Failed to load AMOENA matrix";
const currentYear = getCurrentReportYear();
const previousYear = getPreviousReportYear();
const snapshotPageCode = REPORT_SNAPSHOT_PAGE_CODES.amoena;

export default function Page() {
  return (
    <PowerBiTabbedReportMatrixPage
      brandLabel="AMOENA"
      caption="AMOENA target planning matrix"
      tabs={[
        {
          key: "sales",
          label: "SALES (€)",
          view: {
            brandLabel: "AMOENA",
            caption: "AMOENA SALES target planning matrix",
            categoryOrder: AMOENA_SALES_CATEGORY_ORDER,
            currentSalesPath: "/api/powerbi/amoena-sales-current-year",
            currentYear,
            emptyMessage,
            exportFileName: "amoena-sales-matrix",
            fallbackError,
            headerLabel: "SALES",
            previousSalesPath: "/api/powerbi/amoena-sales-last-year",
            previousYear,
            reportKey: "amoena-sales",
            snapshotPageCode,
            trendPath: "/api/powerbi/amoena-trend-current-year",
          },
        },
        {
          key: "peristatika",
          label: "ΠΕΡΙΣΤΑΤΙΚΑ",
          view: {
            brandLabel: "AMOENA",
            caption: "AMOENA ΠΕΡΙΣΤΑΤΙΚΑ target planning matrix",
            categoryOrder: AMOENA_PERISTATIKA_CATEGORY_ORDER,
            currentSalesPath:
              "/api/powerbi/amoena-sales-no-currency-current-year",
            currentYear,
            emptyMessage,
            exportFileName: "amoena-peristatika-matrix",
            fallbackError,
            headerLabel: "ΠΕΡΙΣΤΑΤΙΚΑ",
            previousSalesPath: "/api/powerbi/amoena-sales-no-currency-last-year",
            previousYear,
            reportKey: "amoena-peristatika",
            snapshotPageCode,
            trendPath: "/api/powerbi/amoena-trend-no-currency-current-year",
          },
        },
      ]}
    />
  );
}
