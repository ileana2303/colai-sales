import { ReportCategoryHubPage } from "@/features/powerBI/ReportCategoryHubPage";
import type { ReportTile } from "@/lib/bi-reports/biReports";

const reports: ReportTile[] = [
  {
    key: "targets-and-trends",
    href: "/powerbi/BBM-reports/targets-and-trends",
    title: "Targets & Trends",
    subtitle: "2026 + 2025 + Trend analysis (MEDTRONIC template)",
    icon: "bi-stars",
    accent: "#dc2626",
  },
  {
    key: "bbm-sales-2026",
    href: "/powerbi/BBM-reports/BBM-sales-2026",
    title: "BBM Sales 2026",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-graph-up-arrow",
    accent: "#2563eb",
  },
  {
    key: "bbm-sales-2025",
    href: "/powerbi/BBM-reports/BBM-sales-2025",
    title: "BBM Sales 2025",
    subtitle: "Mavrogenis Sales Reports 2025CLP",
    icon: "bi-bar-chart-line",
    accent: "#16a34a",
  },
  {
    key: "bbm-trends",
    href: "/powerbi/BBM-reports/BBM-trends",
    title: "BBM Trends",
    subtitle: "BBM Sales Trend by area, group and business unit",
    icon: "bi-activity",
    accent: "#7c3aed",
  },
];

export default function Page() {
  return <ReportCategoryHubPage categoryKey="bbm" reports={reports} />;
}
