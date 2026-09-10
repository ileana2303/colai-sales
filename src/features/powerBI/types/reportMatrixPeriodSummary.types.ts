import type { FilterOption } from "@/features/powerBI/types/PowerBiTable.types";

export type ReportMatrixPeriodSummaryItem = {
  key: string;
  label: string;
  value: string;
  hint: string | null;
};

export type ReportMatrixClosedPeriodSelection = {
  onChange: (value: string) => void;
  options: FilterOption[];
  readOnly?: boolean;
  value: string;
};

export type ReportMatrixLivePeriodSummary = {
  closedPeriodSelection?: ReportMatrixClosedPeriodSelection;
  items: ReportMatrixPeriodSummaryItem[];
};
