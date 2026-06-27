import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COVIDIEN"
      caption="Covidien target planning matrix"
      currentSalesPath="/api/powerbi/covidien-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν Covidien στοιχεία για το area του login."
      fallbackError="Failed to load Covidien matrix"
      previousSalesPath="/api/powerbi/covidien-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="covidien"
      trendPath="/api/powerbi/covidien-trend-current-year"
    />
  );
}
