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
      <section className="app-card p-4">
        <div>
          <h1 className="app-report-title mb-0">{brandLabel}</h1>
          <p className="app-report-subtitle mb-0">{caption}</p>
        </div>
      </section>
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
