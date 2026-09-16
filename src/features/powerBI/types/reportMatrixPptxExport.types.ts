import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";

export type ReportMatrixPptxSlideDefinition = {
  sellerFilter: string;
  sellerLabel: string;
  teamFilter: string;
  teamLabel: string;
  title: string;
};

export type ReportMatrixPptxCapturedSlide = ReportMatrixPptxSlideDefinition & {
  imageDataUrl: string;
  imageHeight: number;
  imageWidth: number;
};

export type ReportMatrixPptxExportOptions = {
  areaLabel: string;
  brandLabel: string;
  categoryFilterLabel: string;
  categoryLabel?: string;
  description?: string;
  exportFileName?: string;
  periodSummary?: ReportMatrixPeriodSummaryItem[];
  slides: ReportMatrixPptxCapturedSlide[];
};
