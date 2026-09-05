import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildBbmSalesCurrentYearQuery,
  normalizeBbmSalesCurrentYearRows,
} from "@/lib/bi-reports/bbm";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "bbm_sales_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildBbmSalesCurrentYearQuery(area),
    targetKey: "bbm_sales_current_year",
  }),
  normalize: normalizeBbmSalesCurrentYearRows,
});
