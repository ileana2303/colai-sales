import type { BiReportPowerBiTargetKey } from "@/lib/bi-reports/biReports.types";
import type { PowerBiExecuteQueriesResponse } from "@/lib/bi-reports/powerBi.types";

export type PowerBiAreaQuerySpec = {
  query: string;
  targetKey: BiReportPowerBiTargetKey;
  label?: string;
};

export type PowerBiAreaReportRouteConfig<TRow> = {
  report: string;
  year: "current" | "previous";
  errorLabel?: string;
  getQueries: (area: string) => PowerBiAreaQuerySpec | PowerBiAreaQuerySpec[];
  normalize: (data: PowerBiExecuteQueriesResponse) => TRow[];
};
