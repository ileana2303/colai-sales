import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildBbmSalesLastYearQuery,
  normalizeBbmSalesLastYearRows,
} from "@/lib/bi-reports/bbm";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "bbm_sales_last_year",
  year: "previous",
  getQueries: (area) => ({
    query: buildBbmSalesLastYearQuery(area),
    targetKey: "bbm_sales_last_year",
  }),
  normalize: normalizeBbmSalesLastYearRows,
});
