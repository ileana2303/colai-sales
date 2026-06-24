import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="PORGES"
      caption="Porges target planning matrix"
      currentSalesPath="/api/powerbi/porges-sales-current-year"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Porges στοιχεία για το area του login."
      fallbackError="Failed to load Porges matrix"
      previousSalesPath="/api/powerbi/porges-sales-last-year"
      previousYear={2025}
      reportKey="porges"
      trendPath="/api/powerbi/porges-trend-current-year"
    />
  );
}
