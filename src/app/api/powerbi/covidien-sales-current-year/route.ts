import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildCovidienSalesQuery,
  normalizeCovidienSalesRows,
} from "@/lib/bi-reports/covidien";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "covidien_sales_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildCovidienSalesQuery(area),
    targetKey: "covidien_sales_current_year",
  }),
  normalize: normalizeCovidienSalesRows,
});
