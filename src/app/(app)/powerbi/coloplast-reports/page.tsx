import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import { COLOPLAST_CATEGORY_ORDER } from "@/lib/bi-reports/coloplast";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COLOPLAST"
      caption="Coloplast target planning matrix"
      categoryOrder={COLOPLAST_CATEGORY_ORDER}
      currentSalesPath="/api/powerbi/coloplast-sales-current-year"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Coloplast στοιχεία για το area του login."
      fallbackError="Failed to load Coloplast matrix"
      previousSalesPath="/api/powerbi/coloplast-sales-last-year"
      previousYear={2025}
      reportKey="coloplast"
      trendPath="/api/powerbi/coloplast-trend-current-year"
    />
  );
}
