import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildPorgesSalesTargetsTrendsQuery,
  normalizePorgesSalesRows,
} from "@/lib/bi-reports/porges";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "porges_sales_current_year_targets",
  year: "current",
  getQueries: (area) => ({
    query: buildPorgesSalesTargetsTrendsQuery(area),
    targetKey: "porges_sales_current_year",
  }),
  normalize: normalizePorgesSalesRows,
});
