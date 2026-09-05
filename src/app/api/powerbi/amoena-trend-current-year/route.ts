import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildAmoenaTrendCurrentYearQuery,
  normalizeAmoenaTrendRows,
} from "@/lib/bi-reports/amoena";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "amoena_trend_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildAmoenaTrendCurrentYearQuery(area),
    targetKey: "amoena_trend_current_year",
  }),
  normalize: normalizeAmoenaTrendRows,
});
