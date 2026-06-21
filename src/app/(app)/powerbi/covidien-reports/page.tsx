import { ReportCategoryHubPage } from "@/features/powerBI/ReportCategoryHubPage";
import type { ReportTile } from "@/lib/bi-reports/biReports";

const reports: ReportTile[] = [
  {
    key: "targets-and-trends",
    href: "/powerbi/covidien-reports/targets-and-trends",
    title: "Targets & Trends",
    subtitle: "2026 + 2025 + Trend analysis (MEDTRONIC template)",
    icon: "bi-stars",
    accent: "#dc2626",
  },
  {
    key: "covidien-sales-2026",
    href: "/powerbi/covidien-reports/covidien-sales-2026",
    title: "Covidien Sales 2026",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-graph-up-arrow",
    accent: "#2563eb",
  },
  {
    key: "covidien-sales-2025",
    href: "/powerbi/covidien-reports/covidien-sales-2025",
    title: "Covidien Sales 2025",
    subtitle: "Mavrogenis Sales Reports 2025CLP",
    icon: "bi-bar-chart-line",
    accent: "#16a34a",
  },
  {
    key: "covidien-trends",
    href: "/powerbi/covidien-reports/covidien-trends",
    title: "Covidien Trends",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-activity",
    accent: "#7c3aed",
  },
];

export default function Page() {
  return <ReportCategoryHubPage categoryKey="covidien" reports={reports} />;
}
