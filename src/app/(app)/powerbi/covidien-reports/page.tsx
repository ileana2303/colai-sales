import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="COVIDIEN"
      caption="Covidien target planning matrix"
      currentSalesPath="/api/powerbi/covidien-sales-current-year"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν Covidien στοιχεία για το area του login."
      fallbackError="Failed to load Covidien matrix"
      previousSalesPath="/api/powerbi/covidien-sales-last-year"
      previousYear={2025}
      reportKey="covidien"
      trendPath="/api/powerbi/covidien-trend-current-year"
    />
  );
}
