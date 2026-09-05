import type { ReactNode } from "react";

import type {
  ReportMatrixRow,
  ReportMatrixRowMetrics,
  ReportMatrixSectionSummary,
  ReportMatrixTone,
} from "@/features/powerBI/types/ReportMatrixTable.types";
import type { PowerBiSellerRow } from "@/lib/bi-reports/sellers.types";

export type PowerBiMatrixSourceRow = {
  group1?: string | null;
  group2?: string | null;
  group3?: string | null;
  team?: string | null;
  sellerCode?: string | null;
  sellerName?: string | null;
  month?: string | null;
  closedMonthStatus?: string | null;
  currency?: number | null;
  tcy?: number | null;
  vcy?: number | null;
  vly?: number | null;
  vlc?: number | null;
  vTrend?: number | null;
};

export type BuildReportMatrixRowsInput = {
  categoryOrder?: string[];
  currentRows: PowerBiMatrixSourceRow[];
  group2Order?: string[];
  previousRows: PowerBiMatrixSourceRow[];
  trendRows: PowerBiMatrixSourceRow[];
  sellersCatalog?: PowerBiSellerRow[];
};

export type MatrixAggregate = {
  group1: string;
  group2: string;
  group3: string;
  team: string;
  sellerCode: string;
  sellerName: string;
  currency: number | null;
  tcyAll: number;
  vcyAll: number;
  tcyClosed: number;
  vcyClosed: number;
  vlc: number;
  vlcAll: number;
  vTrend: number;
  openMonthTcyByMonth: Map<string, number>;
  closedMonthKeys: Set<string>;
  hasClosedMonthStatus: boolean;
};

export type MonthlyTargetMetrics = {
  extraMonthlyTarget: number | null;
  monthlyTarget: number | null;
  newMonthlyTarget: number | null;
};

export type ReportMatrixFinalValues = {
  currentCover: number | null;
  currentDifference: number | null;
  currentResult: number;
  currentTarget: number;
  currentTrend: number;
  extraMonthlyTarget: number | null;
  monthlyTarget: number | null;
  newMonthlyTarget: number | null;
  previousCover: number | null;
  previousDifference: number | null;
  previousResult: number;
  previousTarget: number;
  yearComparison: number | null;
  yearDifference: number | null;
  yearResult: number | null;
  yearResultAll: number;
};

export type MatrixRowOptions = {
  childCount?: number;
  extraMonthlyTargetSum?: number | null;
  key?: string;
  parentKey?: string;
  rowKind?: ReportMatrixRow["rowKind"];
  leadingValues?: Record<string, ReactNode>;
};

export type ReportMatrixSectionSummaries = Partial<
  Record<
    "closed-months" | "current-year" | "monthly-target" | "previous-period",
    ReportMatrixSectionSummary
  >
>;

export type MatrixLySales = {
  /** 2025 sales summed for the same closed months as 2026. */
  vlcSamePeriod: number;
  /** 2025 sales summed for all months in the dataset. */
  vlcAll: number;
};

export type ReportMatrixPeriodMeta = {
  closedPeriodLabel?: string | null;
  closedMonthsCount?: number | null;
  lastClosedMonth?: string | null;
  openMonthsCount?: number | null;
};

export type { ReportMatrixRowMetrics, ReportMatrixTone };
