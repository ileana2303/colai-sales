import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildColoplastSalesCurrentYearQueries,
  normalizeColoplastSalesCurrentYearRows,
} from "@/lib/bi-reports/coloplast";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "coloplast_sales_current_year",
  year: "current",
  errorLabel: "Coloplast sales",
  getQueries: (area) => buildColoplastSalesCurrentYearQueries(area),
  normalize: normalizeColoplastSalesCurrentYearRows,
});
