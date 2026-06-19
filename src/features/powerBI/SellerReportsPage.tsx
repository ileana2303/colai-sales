import Link from "next/link";

import type { ReportTile } from "@/lib/bi-reports/biReports";

type SellerReportsPageProps = {
  subtitle?: string;
};

type SellerReportTile = Omit<ReportTile, "href"> & {
  slug: string;
};

const sellerReportTiles: SellerReportTile[] = [
  {
    key: "sales-per-year",
    title: "Πωλήσεις ανά έτος",
    subtitle: "Coloplast, OC PER και προϊόντα",
    icon: "bi-graph-up-arrow",
    accent: "#7c3aed",
    slug: "sales-per-year",
  },
  {
    key: "sales-per-month",
    title: "Πωλήσεις ανά μήνα",
    subtitle: "Sales measure ανά Calendar month",
    icon: "bi-bar-chart-line",
    accent: "#2563eb",
    slug: "sales-per-month",
  },
  {
    key: "akrateia",
    title: "Ακράτεια",
    subtitle: "CC sales, PER και εκτελέσεις",
    icon: "bi-droplet-half",
    accent: "#dc2626",
    slug: "akrateia",
  },
];

function buildReportHref(slug: string) {
  return `/powerbi/seller-reports/${slug}`;
}

function ReportSelector({ reports }: { reports: ReportTile[] }) {
  return (
    <div className="app-card p-2">
      <div className="d-flex flex-column gap-2">
        {reports.map((report) => (
          <Link
            key={report.key}
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
  );
}

export default function SellerReportsPage({
  subtitle = "Mavrogenis SA Reports",
}: SellerReportsPageProps) {
  const reports = sellerReportTiles.map((report) => ({
    ...report,
    href: buildReportHref(report.slug),
  }));

  return (
    <div className="d-flex flex-column gap-3">
      <section className="app-card p-3">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="min-w-0 flex-grow-1">
            <div className="d-flex align-items-center flex-nowrap gap-2">
              <h1 className="h4 fw-bold text-truncate mb-0">Seller Reports</h1>
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
              {subtitle}
            </div>
          </div>
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 bg-body-tertiary flex-shrink-0"
            style={{ width: 48, height: 48 }}
          >
            <i className="bi bi-clipboard-data" aria-hidden />
          </div>
        </div>
      </section>

      <ReportSelector reports={reports} />
    </div>
  );
}
