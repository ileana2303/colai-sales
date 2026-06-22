import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  createReportMatrixSections,
  reportMatrixLeadingColumns,
} from "@/features/powerBI/reportMatrixData";

type StaticReportMatrixPageProps = {
  brandLabel: string;
  caption: string;
};

const matrixSections = createReportMatrixSections({
  currentYear: 2026,
  previousYear: 2025,
});

export function StaticReportMatrixPage({
  brandLabel,
  caption,
}: StaticReportMatrixPageProps) {
  return (
    <div className="app-page">
      <ReportMatrixTable
        brandLabel={brandLabel}
        caption={caption}
        leadingColumns={reportMatrixLeadingColumns}
        rows={[]}
        sections={matrixSections}
      />
    </div>
  );
}
