import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaSalesCurrentYearQuery,
  normalizeAmoenaSalesCurrentYearRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_sales_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildAmoenaSalesCurrentYearQuery(area),
    targetKey: "amoena_sales_current_year",
  }),
  normalize: normalizeAmoenaSalesCurrentYearRows,
});
