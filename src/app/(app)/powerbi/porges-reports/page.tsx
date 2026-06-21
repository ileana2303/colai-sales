import { ReportCategoryHubPage } from "@/features/powerBI/ReportCategoryHubPage";
import type { ReportTile } from "@/lib/bi-reports/biReports";

const reports: ReportTile[] = [
  {
    key: "targets-and-trends",
    href: "/powerbi/porges-reports/targets-and-trends",
    title: "Targets & Trends",
    subtitle: "2026 + 2025 + Trend analysis (MEDTRONIC template)",
    icon: "bi-stars",
    accent: "#dc2626",
  },
  {
    key: "porges-sales-2026",
    href: "/powerbi/porges-reports/porges-sales-2026",
    title: "Porges Sales 2026",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-graph-up-arrow",
    accent: "#2563eb",
  },
  {
    key: "porges-sales-2025",
    href: "/powerbi/porges-reports/porges-sales-2025",
    title: "Porges Sales 2025",
    subtitle: "Mavrogenis Sales Reports 2025CLP",
    icon: "bi-bar-chart-line",
    accent: "#16a34a",
  },
  {
    key: "porges-trends",
    href: "/powerbi/porges-reports/porges-trends",
    title: "Porges Trends",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-activity",
    accent: "#7c3aed",
  },
];

export default function Page() {
  return <ReportCategoryHubPage categoryKey="porges" reports={reports} />;
}
