import Link from "next/link";

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
    <div className="d-flex flex-column gap-3">
      <section className="app-card p-3">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="min-w-0 flex-grow-1">
            <div className="d-flex align-items-center flex-nowrap gap-2">
              <h1 className="h4 fw-bold text-truncate mb-0">
                BAUSCH & LOMB TRIPLEX Reports
              </h1>
              <span
                className="badge rounded-pill flex-shrink-0"
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
            <div className="text-secondary mt-1" style={{ fontSize: 13 }}>
              Επιλογή BAUSCH & LOMB Report
            </div>
          </div>
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 bg-body-tertiary flex-shrink-0"
            style={{ width: 48, height: 48 }}
          >
            <i className="bi bi-bar-chart" aria-hidden />
          </div>
        </div>
      </section>

      <div className="app-card p-2">
        <div className="d-flex flex-column gap-2">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="rounded-4 bg-body-tertiary d-flex align-items-center text-decoration-none gap-3 p-2 text-start"
              style={{ color: "var(--bs-body-color)" }}
            >
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  background: `${report.accent}18`,
                  color: report.accent,
                  border: `1px solid ${report.accent}33`,
                }}
              >
                <i className={`bi ${report.icon}`} aria-hidden />
              </span>
              <span className="min-w-0 flex-grow-1">
                <span className="fw-semibold text-truncate d-block">
                  {report.title}
                </span>
                <span
                  className="d-block small text-secondary text-truncate"
                  style={{ lineHeight: 1.2 }}
                >
                  {report.subtitle}
                </span>
              </span>
              <i
                className="bi bi-chevron-right text-secondary flex-shrink-0"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
