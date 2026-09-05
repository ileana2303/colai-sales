import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaSalesNoCurrencyLastYearQuery,
  normalizeAmoenaSalesLastYearRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_sales_no_currency_last_year",
  year: "previous",
  getQueries: (area) => ({
    query: buildAmoenaSalesNoCurrencyLastYearQuery(area),
    targetKey: "amoena_sales_no_currency_last_year",
  }),
  normalize: normalizeAmoenaSalesLastYearRows,
});
