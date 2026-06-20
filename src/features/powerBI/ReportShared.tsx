"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    <section className="app-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 grow">
          <div className="flex flex-nowrap items-center gap-2">
            <h1 className="app-report-title mb-0 truncate">{title}</h1>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[11px] leading-none font-medium ${badgeClassName}`}
              style={{
                backgroundColor: "#f2c811",
                border: "1px solid #d9b30d",
                color: "#1f1f1f",
              }}
            >
              PowerBI
            </span>
          </div>
          <div className="app-report-subtitle">{subtitle}</div>
        </div>
        <div className="app-report-icon inline-flex shrink-0 items-center justify-center rounded-xl bg-muted">
          <AppIcon name={icon} size={26} />
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
    <div className="app-card h-full p-5">
      <div className="flex items-start justify-between gap-2">
        <div
          className="inline-flex items-center justify-center rounded-lg"
          style={{
            width: 44,
            height: 44,
            background: `${accent}1f`,
            color: accent,
          }}
        >
          <AppIcon name={icon} size={24} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
          {label}
        </div>
        <div
          className="mt-1.5 text-lg font-bold"
          style={{ letterSpacing: "-0.01em" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function ValuePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
        {label}
      </div>
      <div className="mt-1 truncate text-base font-semibold">{value}</div>
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
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="shrink-0 text-muted-foreground">
          {formatNullableRatioPercent(ratio)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{formatValue(actual)}</span>
        <span>στόχος {formatValue(target)}</span>
      </div>
      <div
        className="mt-2 overflow-hidden rounded-full bg-muted"
        style={{ height: 10 }}
        role="presentation"
      >
        <div
          className="h-full rounded-full"
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
    <Alert variant="destructive" className="mb-0">
      <AlertDescription>{message}</AlertDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onRetry}
      >
        Δοκιμή ξανά
      </Button>
    </Alert>
  );
}
