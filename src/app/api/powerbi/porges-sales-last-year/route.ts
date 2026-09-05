import { createPowerBiAreaReportGetHandler } from "@/lib/bi-reports/createPowerBiAreaReportRoute";
import {
  buildPorgesSalesLastYearQuery,
  normalizePorgesSalesLastYearRows,
} from "@/lib/bi-reports/porges";

export const dynamic = "force-dynamic";

export const GET = createPowerBiAreaReportGetHandler({
  report: "porges_sales_last_year",
  year: "previous",
  getQueries: (area) => ({
    query: buildPorgesSalesLastYearQuery(area),
    targetKey: "porges_sales_last_year",
  }),
  normalize: normalizePorgesSalesLastYearRows,
});
