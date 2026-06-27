import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  COLOPLAST_CATEGORY_ORDER,
  COLOPLAST_GROUP2_ORDER,
} from "@/lib/bi-reports/coloplast";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COLOPLAST"
      caption="Coloplast target planning matrix"
      categoryOrder={COLOPLAST_CATEGORY_ORDER}
      group2Order={COLOPLAST_GROUP2_ORDER}
      currentSalesPath="/api/powerbi/coloplast-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν Coloplast στοιχεία για το area του login."
      fallbackError="Failed to load Coloplast matrix"
      previousSalesPath="/api/powerbi/coloplast-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="coloplast"
      trendPath="/api/powerbi/coloplast-trend-current-year"
    />
  );
}
