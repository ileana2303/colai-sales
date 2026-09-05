import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import type { PowerBiMatrixSourceRow } from "@/features/powerBI/types/reportMatrixData.types";
import type { ReportMatrixRow } from "@/features/powerBI/types/ReportMatrixTable.types";

export type MatrixReportPayload = {
  area: string;
  headerLabel: string;
  currentRows: PowerBiMatrixSourceRow[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
  precalculatedRows?: ReportMatrixRow[];
  /** Set when this payload was read from Supabase instead of live Power BI. */
  snapshotDate?: string;
  snapshotPeriod?: {
    closedPeriodLabel: string | null;
    closedMonthsCount: number | null;
    lastClosedMonth: string | null;
    openMonthsCount: number | null;
  };
};

export type PowerBiReportMatrixViewProps = {
  brandLabel: string;
  categoryOrder?: string[];
  currentSalesPath: string;
  currentYear: number;
  emptyMessage: string;
  exportFileName: string;
  fallbackError: string;
  group2Order?: string[];
  headerLabel?: string;
  hidden?: boolean;
  previousSalesPath: string;
  previousYear: number;
  reportKey: string;
  /**
   * When set, the table is populated from the sales_snapshots row for this
   * page_code (via v_available_snapshots) whenever one is available, instead
   * of querying Power BI live. It also ensures a snapshot from the last
   * 7 days exists for future loads.
   */
  snapshotPageCode?: string;
  /**
   * Some pages store more than one business view under the same page_code
   * (e.g. AMOENA "SALES" vs "ΠΕΡΙΣΤΑΤΙΚΑ"). Set this to the currency flag
   * (0 or 1) used by this view's Power BI queries to select the matching
   * subset of snapshot rows.
   */
  snapshotCurrency?: 0 | 1;
  /** ISO date of a user-selected historical snapshot. */
  snapshotDate?: string;
  trendPath: string;
  periodSummary?: ReportMatrixPeriodSummaryItem[];
};

export type PowerBiReportMatrixPageProps = Omit<
  PowerBiReportMatrixViewProps,
  "exportFileName" | "hidden"
>;

export type ReportMatrixTab = {
  key: string;
  label: string;
  view: PowerBiReportMatrixViewProps;
};

export type PowerBiTabbedReportMatrixPageProps = {
  brandLabel: string;
  tabs: ReportMatrixTab[];
};
