import {
  AKRATEIA_CATEGORY_ORDER,
  buildAkrateiaTrendCurrentYearQueries,
  normalizeAkrateiaTrendCurrentYearRows,
} from "@/lib/bi-reports/akrateia";
import {
  createPowerBiAreaReportGetHandler,
  queriesFromList,
} from "@/lib/bi-reports/createPowerBiAreaReportRoute";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "akrateia_trend_current_year",
  year: "current",
  errorLabel: "Akrateia trend",
  getQueries: (area) =>
    queriesFromList(buildAkrateiaTrendCurrentYearQueries(area), "akrateia_trend_current_year", AKRATEIA_CATEGORY_ORDER),
  normalize: normalizeAkrateiaTrendCurrentYearRows,
});
