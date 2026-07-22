import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";
import { REPORT_SNAPSHOT_PAGE_CODES } from "@/lib/snapshots/pageAvailability";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COVIDIEN"
      caption="COVIDIEN target planning matrix"
      currentSalesPath="/api/powerbi/covidien-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν Covidien στοιχεία για το area του login."
      fallbackError="Failed to load Covidien matrix"
      previousSalesPath="/api/powerbi/covidien-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="covidien"
      snapshotPageCode={REPORT_SNAPSHOT_PAGE_CODES.covidien}
      trendPath="/api/powerbi/covidien-trend-current-year"
    />
  );
}
