import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaSalesLastYearQuery,
  normalizeAmoenaSalesLastYearRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_sales_last_year",
  year: "previous",
  getQueries: (area) => ({
    query: buildAmoenaSalesLastYearQuery(area),
    targetKey: "amoena_sales_last_year",
  }),
  normalize: normalizeAmoenaSalesLastYearRows,
});
