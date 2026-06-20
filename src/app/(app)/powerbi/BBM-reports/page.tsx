import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";

const reports = [
  {
    href: "/powerbi/BBM-reports/BBM-sales-2026",
    title: "BBM Sales 2026",
    subtitle: "Mavrogenis Sales Reports 2026CLP",
    icon: "bi-graph-up-arrow",
    accent: "#2563eb",
  },
  {
    href: "/powerbi/BBM-reports/BBM-sales-2025",
    title: "BBM Sales 2025",
    subtitle: "Mavrogenis Sales Reports 2025CLP",
    icon: "bi-bar-chart-line",
    accent: "#16a34a",
  },
  {
    href: "/powerbi/BBM-reports/BBM-trends",
    title: "BBM Trends",
    subtitle: "BBM Sales Trend by area, group and business unit",
    icon: "bi-activity",
    accent: "#7c3aed",
  },
] as const;

export default function Page() {
  return (
    <div className="app-page">
      <section className="app-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 grow">
            <div className="flex items-center flex-nowrap gap-2">
              <h1 className="text-xl font-bold truncate mb-0">
                BAUSCH & LOMB TRIPLEX Reports
              </h1>
              <span
                className="inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium"
                style={{
                  backgroundColor: "#f2c811",
                  border: "1px solid #d9b30d",
                  color: "#1f1f1f",
                  fontSize: 10,
                  lineHeight: 1,
                  padding: "4px 7px",
                }}
              >
                PowerBI
              </span>
            </div>
            <div className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
              Επιλογή BAUSCH & LOMB Report
            </div>
          </div>
          <div
            className="inline-flex items-center justify-center rounded-xl bg-muted shrink-0"
            style={{ width: 48, height: 48 }}
          >
            <AppIcon name="bi-bar-chart" size={22} />
          </div>
        </div>
      </section>

      <div className="app-card p-4">
        <div className="app-tile-grid">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="app-nav-tile"
            >
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
                <span className="block truncate font-semibold">
                  {report.title}
                </span>
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
    </div>
  );
}
