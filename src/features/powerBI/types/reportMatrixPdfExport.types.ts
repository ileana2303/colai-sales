import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import type {
  ReportMatrixLeadingColumn,
  ReportMatrixRow,
  ReportMatrixSection,
} from "@/features/powerBI/types/ReportMatrixTable.types";

export type ReportMatrixPdfFilters = {
  area: string;
  category: string;
  group2?: string;
  team: string;
  seller: string;
};

export type ReportMatrixPdfPage = {
  filters: ReportMatrixPdfFilters;
  rows: ReportMatrixRow[];
  sellerFilterActive?: boolean;
};

export type ReportMatrixPdfExportOptions = {
  brandLabel: string;
  categoryLabel?: string;
  description?: string;
  exportFileName?: string;
  headerLabel?: string;
  leadingColumns: ReportMatrixLeadingColumn[];
  pages: ReportMatrixPdfPage[];
  periodSummary?: ReportMatrixPeriodSummaryItem[];
  sections: ReportMatrixSection[];
};
