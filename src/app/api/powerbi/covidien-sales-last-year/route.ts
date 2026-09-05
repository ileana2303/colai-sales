import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildCovidienSalesLastYearQuery,
  normalizeCovidienSalesLastYearRows,
} from "@/lib/bi-reports/covidien";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "covidien_sales_last_year",
  year: "previous",
  getQueries: (area) => ({
    query: buildCovidienSalesLastYearQuery(area),
    targetKey: "covidien_sales_last_year",
  }),
  normalize: normalizeCovidienSalesLastYearRows,
});
