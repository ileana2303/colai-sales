import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";
import { REPORT_SNAPSHOT_PAGE_CODES } from "@/lib/snapshots/pageAvailability";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="BAUSCH & LOMB"
      caption="BAUSCH & LOMB TRIPLEX target planning matrix"
      currentSalesPath="/api/powerbi/bbm-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν BAUSCH & LOMB στοιχεία για το area του login."
      fallbackError="Failed to load BAUSCH & LOMB matrix"
      previousSalesPath="/api/powerbi/bbm-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="bbm"
      snapshotPageCode={REPORT_SNAPSHOT_PAGE_CODES.bbm}
      trendPath="/api/powerbi/bbm-trends-current-year"
    />
  );
}
