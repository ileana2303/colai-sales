export type PowerBiReportTargetProps = {
  workspaceId?: string;
  datasetId?: string;
};

export function buildPowerBiReportApiUrl(
  pathname: string,
  { workspaceId, datasetId }: PowerBiReportTargetProps = {},
) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (datasetId) params.set("datasetId", datasetId);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
