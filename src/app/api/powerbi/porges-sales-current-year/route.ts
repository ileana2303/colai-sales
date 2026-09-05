import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildPorgesSalesQuery,
  normalizePorgesSalesRows,
} from "@/lib/bi-reports/porges";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "porges_sales_current_year",
  year: "current",
  getQueries: (area) => ({
    query: buildPorgesSalesQuery(area),
    targetKey: "porges_sales_current_year",
  }),
  normalize: normalizePorgesSalesRows,
});
