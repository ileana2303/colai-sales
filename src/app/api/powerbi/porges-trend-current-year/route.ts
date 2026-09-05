import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildPorgesTrendQuery,
  normalizePorgesTrendRows,
} from "@/lib/bi-reports/porges";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "porges_trend_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildPorgesTrendQuery(area),
    targetKey: "porges_trend_current_year",
  }),
  normalize: normalizePorgesTrendRows,
});
