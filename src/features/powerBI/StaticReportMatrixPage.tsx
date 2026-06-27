import { ReportMatrixTable } from "@/features/powerBI/ReportMatrixTable";
import {
  createReportMatrixSections,
  reportMatrixLeadingColumns,
} from "@/features/powerBI/reportMatrixData";
import {
  getCurrentReportYear,
  getPreviousReportYear,
} from "@/lib/bi-reports/powerBi";

type StaticReportMatrixPageProps = {
  brandLabel: string;
  caption: string;
};

const matrixSections = createReportMatrixSections({
  currentYear: getCurrentReportYear(),
  previousYear: getPreviousReportYear(),
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
