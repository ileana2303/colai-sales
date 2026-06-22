import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import { AKRATEIA_CATEGORY_ORDER } from "@/lib/bi-reports/akrateia";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="AKRATEIA"
      caption="Akrateia target planning matrix"
      categoryOrder={AKRATEIA_CATEGORY_ORDER}
      currentSalesPath="/api/powerbi/akrateia-sales-2026"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Akrateia στοιχεία για το area του login."
      fallbackError="Failed to load Akrateia matrix"
      previousSalesPath="/api/powerbi/akrateia-sales-2025"
      previousYear={2025}
      reportKey="akrateia"
      trendPath="/api/powerbi/akrateia-trend-2026"
    />
  );
}
