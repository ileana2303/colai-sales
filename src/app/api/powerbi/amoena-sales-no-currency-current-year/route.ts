import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaSalesNoCurrencyCurrentYearQuery,
  normalizeAmoenaSalesCurrentYearRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_sales_no_currency_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildAmoenaSalesNoCurrencyCurrentYearQuery(area),
    targetKey: "amoena_sales_no_currency_current_year",
  }),
  normalize: normalizeAmoenaSalesCurrentYearRows,
});
