import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import type {
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixSection,
} from "@/features/powerBI/types/ReportMatrixTable.types";

export type ReportMatrixPdfFilters = {
  category: string;
  group2?: string;
  team: string;
  seller: string;
};

export type ReportMatrixPdfExportOptions = {
  brandLabel: string;
  categoryLabel?: string;
  description?: string;
  exportFileName?: string;
  filters: ReportMatrixPdfFilters;
  headerLabel?: string;
  leadingColumns: ReportMatrixLeadingColumn[];
  periodSummary?: ReportMatrixPeriodSummaryItem[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  sellerFilterActive?: boolean;
};
