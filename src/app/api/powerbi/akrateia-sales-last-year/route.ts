import {
  AKRATEIA_CATEGORY_ORDER,
  buildAkrateiaSalesLastYearQueries,
  normalizeAkrateiaSalesLastYearRows,
} from "@/lib/bi-reports/akrateia";
import {
  createPowerBiAreaReportGetHandler,
  queriesFromList,
} from "@/lib/bi-reports/createPowerBiAreaReportRoute";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "akrateia_sales_last_year",
  year: "previous",
  errorLabel: "Akrateia sales",
  getQueries: (area) =>
    queriesFromList(buildAkrateiaSalesLastYearQueries(area), "akrateia_sales_last_year", AKRATEIA_CATEGORY_ORDER),
  normalize: normalizeAkrateiaSalesLastYearRows,
});
