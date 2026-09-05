import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildBbmTrendQuery,
  normalizeBbmTrendRows,
} from "@/lib/bi-reports/bbm";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "bbm_trends_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildBbmTrendQuery(area),
    targetKey: "bbm_trends_current_year",
  }),
  normalize: normalizeBbmTrendRows,
});
