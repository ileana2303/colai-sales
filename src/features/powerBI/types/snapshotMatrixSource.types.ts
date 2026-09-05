import type { PowerBiMatrixSourceRow } from "@/features/powerBI/types/reportMatrixData.types";

export type SnapshotMatrixSource = {
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
};
