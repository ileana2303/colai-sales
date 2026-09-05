import type { ReactNode } from "react";

import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";

export type ReportMatrixTone =
  | "danger"
  | "default"
  | "muted"
  | "primary"
  | "rose"
  | "success"
  | "warning";

export type ReportMatrixColumn = {
  key: string;
  label: ReactNode;
  align?: "center" | "left" | "right";
  headerTone?: ReportMatrixTone;
  cellTone?: ReportMatrixTone;
  width?: number;
};

export type ReportMatrixLeadingColumn = {
  key: string;
  label: ReactNode;
  width: number;
};

export type ReportMatrixSectionSummary = {
  details?: ReactNode[];
  label: ReactNode;
  tone?: ReportMatrixTone;
  value: ReactNode;
};

export type ReportMatrixSection = {
  key: string;
  summary?: ReportMatrixSectionSummary;
  title: ReactNode;
  columns: ReportMatrixColumn[];
  tone?: ReportMatrixTone;
};

export type ReportMatrixRowMetrics = {
  currency: number | null;
  hasClosedMonthStatus: boolean;
  openMonthTcyByMonth: Record<string, number>;
  tcyAll: number;
  tcyClosed: number;
  vTrend: number;
  vcyAll: number;
  vcyClosed: number;
  vlc: number;
  vlcAll: number;
};

export type ReportMatrixRow = {
  key: string;
  category: ReactNode;
  childCount?: number;
  filterValues?: {
    category: string;
    group2: string;
    group3?: string;
    seller: string;
    sellerLabel: string;
    team: string;
  };
  isSellerFlattened?: boolean;
  leadingValues?: Record<string, ReactNode>;
  metrics?: ReportMatrixRowMetrics;
  parentKey?: string;
  rowKind?: "category" | "detail" | "group2" | "group3" | "team" | "total";
  values: Record<string, ReactNode>;
  cellTones?: Record<string, ReportMatrixTone>;
  isTotal?: boolean;
};

export type ReportMatrixTableProps = {
  brandLabel: string;
  categoryLabel?: string;
  description?: string;
  exportFileName?: string;
  group2Order?: string[];
  headerLabel?: ReactNode;
  /** When true, period summary is rendered elsewhere (e.g. page header). */
  hideSummaryPill?: boolean;
  leadingColumns?: ReportMatrixLeadingColumn[];
  periodSummary?: ReportMatrixPeriodSummaryItem[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  title?: string;
};
