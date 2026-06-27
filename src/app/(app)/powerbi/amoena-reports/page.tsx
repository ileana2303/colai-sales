import { PowerBiReportMatrixPage } from "@/features/powerBI/PowerBiReportMatrixPage";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";

const AMOENA_CATEGORY_ORDER = [
  "ΤΖΙΡΟΣ ΧΟΝΔΡΙΚΗΣ",
  "ΝΟΣΟΚΟΜΕΙΑΚΟΣ",
  "ΤΖΙΡΟΣ ΛΙΑΝΙΚΗΣ",
  "ΤΖΙΡΟΣ ΝΕΩΝ",
  "ΝΕΑ ΠΕΡΙΣΤΑΤΙΚΑ",
  "Μ.Ο. ΝΕΩΝ",
];

export default function Page() {
  return (
    <PowerBiReportMatrixPage
      brandLabel="AMOENA"
      caption="AMOENA target planning matrix"
      categoryOrder={AMOENA_CATEGORY_ORDER}
      currentSalesPath="/api/powerbi/amoena-sales-current-year"
      currentYear={getCurrentReportYear()}
      emptyMessage="Δεν βρέθηκαν AMOENA στοιχεία για το area του login."
      fallbackError="Failed to load AMOENA matrix"
      previousSalesPath="/api/powerbi/amoena-sales-last-year"
      previousYear={getPreviousReportYear()}
      reportKey="amoena"
      trendPath="/api/powerbi/amoena-trend-current-year"
    />
  );
}
