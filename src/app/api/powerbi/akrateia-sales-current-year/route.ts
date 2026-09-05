import {
  AKRATEIA_CATEGORY_ORDER,
  buildAkrateiaSalesCurrentYearQueries,
  normalizeAkrateiaSalesCurrentYearRows,
} from "@/lib/bi-reports/akrateia";
import {
  createPowerBiAreaReportGetHandler,
  queriesFromList,
} from "@/lib/bi-reports/createPowerBiAreaReportRoute";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "akrateia_sales_current_year",
  year: "current",
  errorLabel: "Akrateia sales",
  getQueries: (area) =>
    queriesFromList(buildAkrateiaSalesCurrentYearQueries(area), "akrateia_sales_current_year", AKRATEIA_CATEGORY_ORDER),
  normalize: normalizeAkrateiaSalesCurrentYearRows,
});
