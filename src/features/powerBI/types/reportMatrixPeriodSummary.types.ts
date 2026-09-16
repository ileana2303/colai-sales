export type ReportMatrixPeriodSummaryItem = {
  key: string;
  label: string;
  value: string;
  hint: string | null;
};

export type ReportMatrixClosedPeriodRange = {
  startMonthIndex: number;
  endMonthIndex: number;
};

export type ReportMatrixClosedPeriodSelection = {
  endMonthIndex: number;
  lastClosedMonthIndex: number;
  onChange: (range: ReportMatrixClosedPeriodRange) => void;
  readOnly?: boolean;
  startMonthIndex: number;
  year: number;
};

export type ReportMatrixLivePeriodSummary = {
  closedPeriodSelection?: ReportMatrixClosedPeriodSelection;
  items: ReportMatrixPeriodSummaryItem[];
};
