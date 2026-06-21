import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";
import { ReportCategoryBanner } from "@/features/powerBI/ReportCategoryBanner";
import { UnderConstructionView } from "@/features/powerBI/UnderConstructionView";
import type { ReportTile } from "@/lib/bi-reports/biReports";
import {
  getReportCategory,
  type ReportCategoryKey,
} from "@/lib/bi-reports/reportCategories";

type ReportCategoryHubPageProps = {
  categoryKey: ReportCategoryKey;
  reports?: readonly ReportTile[];
};

function ReportTileGrid({ reports }: { reports: readonly ReportTile[] }) {
  return (
    <div className="app-card p-4">
      <div className="app-tile-grid">
        {reports.map((report) => (
          <Link key={report.href} href={report.href} className="app-nav-tile">
            <span
              className="app-nav-tile__icon"
              style={{
                background: `${report.accent}18`,
                color: report.accent,
                border: `1px solid ${report.accent}33`,
              }}
            >
              <AppIcon name={report.icon} size={20} />
            </span>
            <span className="min-w-0 grow">
              <span className="block truncate font-semibold">{report.title}</span>
              <span
                className="block truncate text-sm text-muted-foreground"
                style={{ lineHeight: 1.2 }}
              >
                {report.subtitle}
              </span>
            </span>
            <AppIcon
              name="bi-chevron-right"
              className="shrink-0 text-muted-foreground"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportCategoryHubPage({
  categoryKey,
  reports = [],
}: ReportCategoryHubPageProps) {
  const category = getReportCategory(categoryKey);

  return (
    <div className="app-page">
      <ReportCategoryBanner category={category} />

      {category.status === "comingSoon" ? (
        <UnderConstructionView category={category} />
      ) : reports.length ? (
        <ReportTileGrid reports={reports} />
      ) : null}
    </div>
  );
}
