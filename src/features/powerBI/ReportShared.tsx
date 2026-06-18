"use client";

import { formatNullableRatioPercent } from "@/lib/bi-reports/reportUtils";

export function ReportHeader({
  title,
  subtitle,
  icon,
  badgeClassName = "",
}: {
  title: string;
  subtitle: string;
  icon: string;
  badgeClassName?: string;
}) {
  return (
    <section className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0 flex-grow-1">
          <div className="d-flex align-items-center flex-nowrap gap-2">
            <h1 className="h4 fw-bold text-truncate mb-0">{title}</h1>
            <span
              className={`badge rounded-pill flex-shrink-0 ${badgeClassName}`}
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
          <i className={`bi ${icon}`} aria-hidden />
        </div>
      </div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="col-6">
      <div className="app-card h-100 p-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 38,
              height: 38,
              background: `${accent}1f`,
              color: accent,
            }}
          >
            <i className={`bi ${icon}`} aria-hidden />
          </div>
        </div>
        <div className="mt-3">
          <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
            {label}
          </div>
          <div
            className="fw-bold mt-1"
            style={{ fontSize: "1.05rem", letterSpacing: "-0.01em" }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValuePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-4 bg-body-tertiary p-2">
      <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
        {label}
      </div>
      <div className="fw-semibold text-truncate mt-1">{value}</div>
    </div>
  );
}

export function TargetBar({
  label,
  actual,
  target,
  coverage,
  accent,
  formatValue,
}: {
  label: string;
  actual: number | null;
  target: number | null;
  coverage: number | null;
  accent: string;
  formatValue: (value: number | null) => string;
}) {
  const ratio =
    coverage ??
    (actual != null && target != null && target > 0 ? actual / target : null);
  const width = ratio == null ? 0 : Math.min(100, Math.max(0, ratio * 100));

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between small gap-2">
        <span className="fw-semibold">{label}</span>
        <span className="text-secondary flex-shrink-0">
          {formatNullableRatioPercent(ratio)}
        </span>
      </div>
      <div className="d-flex align-items-center justify-content-between small text-secondary mt-1 gap-2">
        <span>{formatValue(actual)}</span>
        <span>στόχος {formatValue(target)}</span>
      </div>
      <div
        className="rounded-pill bg-body-tertiary mt-2"
        style={{ height: 8, overflow: "hidden" }}
        role="presentation"
      >
        <div
          className="rounded-pill h-100"
          style={{
            width: `${width}%`,
            background: ratio != null && ratio >= 1 ? "#16a34a" : accent,
          }}
        />
      </div>
    </div>
  );
}

export function ReportError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="alert alert-danger mb-0">
      <div>{message}</div>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger mt-2"
        onClick={onRetry}
      >
        Δοκιμή ξανά
      </button>
    </div>
  );
}
