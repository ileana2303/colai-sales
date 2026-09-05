import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaTrendNoCurrencyCurrentYearQuery,
  normalizeAmoenaTrendRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_trend_no_currency_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildAmoenaTrendNoCurrencyCurrentYearQuery(area),
    targetKey: "amoena_trend_no_currency_current_year",
  }),
  normalize: normalizeAmoenaTrendRows,
});
