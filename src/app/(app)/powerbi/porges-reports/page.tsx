import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="PORGES"
      caption="Porges target planning matrix"
      currentSalesPath="/api/powerbi/porges-sales-2026"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Porges στοιχεία για το area του login."
      fallbackError="Failed to load Porges matrix"
      previousSalesPath="/api/powerbi/porges-sales-2025"
      previousYear={2025}
      reportKey="porges"
      trendPath="/api/powerbi/porges-trend-2026"
    />
  );
}
