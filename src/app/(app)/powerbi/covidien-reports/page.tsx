import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COVIDIEN"
      caption="Covidien target planning matrix"
      currentSalesPath="/api/powerbi/covidien-sales-2026"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Covidien στοιχεία για το area του login."
      fallbackError="Failed to load Covidien matrix"
      previousSalesPath="/api/powerbi/covidien-sales-2025"
      previousYear={2025}
      reportKey="covidien"
      trendPath="/api/powerbi/covidien-trend-2026"
    />
  );
}
