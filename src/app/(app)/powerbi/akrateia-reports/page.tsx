import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  AKRATEIA_CATEGORY_ORDER,
  AKRATEIA_GROUP2_ORDER,
} from "@/lib/bi-reports/akrateia";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="AKRATEIA"
      caption="Akrateia target planning matrix"
      categoryOrder={AKRATEIA_CATEGORY_ORDER}
      group2Order={AKRATEIA_GROUP2_ORDER}
      currentSalesPath="/api/powerbi/akrateia-sales-current-year"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Akrateia στοιχεία για το area του login."
      fallbackError="Failed to load Akrateia matrix"
      previousSalesPath="/api/powerbi/akrateia-sales-last-year"
      previousYear={2025}
      reportKey="akrateia"
      trendPath="/api/powerbi/akrateia-trend-current-year"
    />
  );
}
