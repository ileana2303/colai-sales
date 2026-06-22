import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="B&L"
      caption="BAUSCH & LOMB TRIPLEX target planning matrix"
      currentSalesPath="/api/powerbi/bbm-sales-2026"
      currentYear={2026}
      emptyMessage="Δεν βρέθηκαν BAUSCH & LOMB στοιχεία για το area του login."
      fallbackError="Failed to load BAUSCH & LOMB matrix"
      previousSalesPath="/api/powerbi/bbm-sales-2025"
      previousYear={2025}
      reportKey="bbm"
      trendPath="/api/powerbi/bbm-trends-2026"
    />
  );
}
