import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";
import { REPORT_SNAPSHOT_PAGE_CODES } from "@/lib/snapshots/pageAvailability";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="PORGES"
      caption="PORGES target planning matrix"
      currentSalesPath="/api/powerbi/porges-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν Porges στοιχεία για το area του login."
      fallbackError="Failed to load Porges matrix"
      previousSalesPath="/api/powerbi/porges-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="porges"
      snapshotPageCode={REPORT_SNAPSHOT_PAGE_CODES.porges}
      trendPath="/api/powerbi/porges-trend-current-year"
    />
  );
}
