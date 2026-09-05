import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildColoplastTrendCurrentYearQueries,
  normalizeColoplastTrendCurrentYearRows,
} from "@/lib/bi-reports/coloplast";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "coloplast_trend_current_year",
  year: "current",
  errorLabel: "Coloplast trend",
  getQueries: (area) => buildColoplastTrendCurrentYearQueries(area),
  normalize: normalizeColoplastTrendCurrentYearRows,
});
