export type ReportQueryType = "VCYTCY" | "VLY" | "VTREND";

export type StoredReportQueryType =
  | ReportQueryType
  | "CY"
  | "LY"
  | "TREND"
  | string;

export type ReportQuery = {
  id: string;
  report_page: string;
  report_code: string;
  report_type: ReportQueryType;
  report_desc: string | null;
  business_unit: string | null;
  page_code: string | null;
  report_page_desc: string | null;
  dataset_id: string | null;
  dax_query: string;
  currency: number | null;
  is_active: boolean | null;
};

export type StoredReportQuery = Omit<ReportQuery, "report_type"> & {
  report_type: StoredReportQueryType;
};

export type ReportQueryTriple = Record<ReportQueryType, ReportQuery>;

export type IncompleteReportQueryGroup = {
  key: string;
  reportBase: string;
  missingTypes: ReportQueryType[];
  queries: Partial<Record<ReportQueryType, ReportQuery>>;
};

export type ReportQueryGroups = {
  complete: ReportQueryTriple[];
  incomplete: IncompleteReportQueryGroup[];
};

export type JoinedSnapshotSourceRow = {
  sellerCode: string | null;
  sellerName: string | null;
  team: string | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  month: number | null;
  closedMonthStatus: string | null;
  currency?: number | null;
  pbi_query_calc_01: number | null;
  pbi_query_calc_02: number | null;
  pbi_query_calc_03: number | null;
  pbi_query_calc_04: number | null;
};

export type SnapshotRowKind =
  | "category"
  | "detail"
  | "group2"
  | "group3"
  | "team"
  | "total";

export type SnapshotRow = {
  id: string;
  snapshot_date: string;
  snapshot_ts: string | null;
  username: string;
  area: string;
  is_active: boolean;
  closed_period_label: string | null;
  closed_months_count: number | null;
  last_closed_month: string | null;
  open_months_count: number | null;
  year: number | null;
  report_query_id: string | null;
  report_page: string | null;
  report_code: string | null;
  report_desc: string | null;
  page_code: string | null;
  workbook_id: string | null;
  seller_code: string | null;
  seller_name: string | null;
  team: string | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  currency: number | null;
  calculation_version: string;
  row_kind: SnapshotRowKind;
  row_key: string;
  parent_key: string | null;
  child_count: number | null;
  is_total: boolean;
  has_closed_month_status: boolean;
  open_month_tcy_by_month: Record<string, number>;
  previous_target: number;
  previous_result: number;
  previous_cover: number | null;
  previous_difference: number | null;
  year_result: number | null;
  year_comparison: number | null;
  year_difference: number | null;
  current_target: number;
  current_result: number;
  current_trend: number;
  current_cover: number | null;
  current_difference: number | null;
  monthly_target: number | null;
  extra_monthly_target: number | null;
  new_monthly_target: number | null;
  previous_year_result_all: number;
  display_values: Record<string, string>;
  cell_tones: Record<string, string> | null;
};

export type AvailableSnapshot = {
  snapshot_date: string;
  snapshot_ts: string | null;
  username: string;
  area: string;
  page_code: string;
  report_page: string | null;
  workbook_id: string | null;
  year: number | null;
  closed_period_label: string | null;
  closed_months_count: number | null;
  last_closed_month: string | null;
  open_months_count: number | null;
  rows_count: number;
};

export type AvailableSnapshotsResponse =
  | { ok: true; snapshots: AvailableSnapshot[] }
  | { ok: false; message: string };

export type SnapshotResponse =
  | {
      ok: true;
      rows: SnapshotRow[];
      snapshot: AvailableSnapshot | null;
      fromCache: boolean;
      isStale: boolean;
      refreshAttempted: boolean;
      warning?: string;
    }
  | { ok: false; message: string };

export type SnapshotLookup = {
  area: string;
  pageCode: string;
  year: number;
};

export type SnapshotReadResult = {
  rows: SnapshotRow[];
  snapshot: AvailableSnapshot | null;
};

export type EnsureSnapshotRequest = SnapshotLookup & {
  compareYear: number;
};

export type EnsureSnapshotResult = SnapshotReadResult & {
  fromCache: boolean;
  isStale: boolean;
  refreshAttempted: boolean;
  warning?: string;
};

export type RefreshSnapshotRequest = {
  area: string;
  pageCode: string;
  currentYear: number;
  compareYear: number;
  queryIds?: string[];
};

export type RefreshSnapshotResponse =
  | {
      ok: true;
      fromCache: false;
      rowCount: number;
      snapshotDate: string;
    }
  | { ok: false; message: string };

export type RefreshSnapshotResult = {
  rowCount: number;
  snapshotDate: string;
};

export type SnapshotRatioColumn =
  | "react_calc_01"
  | "react_calc_03"
  | "react_calc_06";

export type SnapshotRatioDiagnostic = {
  column: SnapshotRatioColumn;
  value: number;
  row: Record<string, unknown>;
};

export type LegacyRatioSanitizationResult = {
  rows: Record<string, unknown>[];
  changedCount: number;
};
