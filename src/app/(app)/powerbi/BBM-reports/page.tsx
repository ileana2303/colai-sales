import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="Bausch & Lomb"
      caption="BAUSCH & LOMB TRIPLEX target planning matrix"
      currentSalesPath="/api/powerbi/bbm-sales-current-year"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν BAUSCH & LOMB στοιχεία για το area του login."
      fallbackError="Failed to load BAUSCH & LOMB matrix"
      previousSalesPath="/api/powerbi/bbm-sales-last-year"
      previousYear={2025}
      reportKey="bbm"
      trendPath="/api/powerbi/bbm-trends-current-year"
    />
  );
}
