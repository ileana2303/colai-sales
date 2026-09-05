import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildCovidienTrendQuery,
  normalizeCovidienTrendRows,
} from "@/lib/bi-reports/covidien";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "covidien_trend_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildCovidienTrendQuery(area),
    targetKey: "covidien_trend_current_year",
  }),
  normalize: normalizeCovidienTrendRows,
});
