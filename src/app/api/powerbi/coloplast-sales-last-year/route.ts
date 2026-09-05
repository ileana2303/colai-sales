import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildColoplastSalesLastYearQueries,
  normalizeColoplastSalesLastYearRows,
} from "@/lib/bi-reports/coloplast";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "coloplast_sales_last_year",
  year: "previous",
  errorLabel: "Coloplast sales",
  getQueries: (area) => buildColoplastSalesLastYearQueries(area),
  normalize: normalizeColoplastSalesLastYearRows,
});
