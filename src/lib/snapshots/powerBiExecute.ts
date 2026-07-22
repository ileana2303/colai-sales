import "server-only";

import {
  executePowerBiQuery,
  PowerBiRequestError,
} from "@/lib/bi-reports/powerBi";
import { renderDaxTemplate } from "@/lib/snapshots/daxTemplate";
import type {
  RefreshSnapshotRequest,
  ReportQuery,
} from "@/lib/snapshots/types";

export async function executeReportQuery(
  amsaAccessToken: string,
  query: ReportQuery,
  input: RefreshSnapshotRequest,
) {
  if (!query.dataset_id) {
    throw new Error(`Missing dataset_id for ${query.report_code}.`);
  }

  try {
    const response = await executePowerBiQuery(
      renderDaxTemplate(query.dax_query, input),
      { datasetId: query.dataset_id, workspaceId: "" },
      { amsaAccessToken },
    );

    return response.results?.[0]?.tables?.[0]?.rows ?? [];
  } catch (error) {
    const message =
      error instanceof PowerBiRequestError || error instanceof Error
        ? error.message
        : "Power BI request failed.";
    throw new Error(
      `${query.report_code} failed on dataset ${query.dataset_id}: ${message}`,
    );
  }
}
