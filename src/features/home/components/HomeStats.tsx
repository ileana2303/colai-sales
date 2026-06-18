"use client";

import { WcDistributionCharts } from "@/features/home/components/DashboardCharts";
import { parseProxyJson } from "@/lib/api/client";
import {
  isManagerWithoutSellerRole,
  normalizeSellerCode,
} from "@/lib/sellerAccess";
import { parseLocaleNumber } from "@/lib/utils/number";
import { useAppSelector } from "@/store/hooks";
import type { GetWcTeamatesSuccess, SellerTeamatesWC } from "@/types/api";
import type { StoxoiMina } from "@/types/api/schemas";
import Link from "next/link";
import React from "react";

type WcEndpointSummary = {
  newCount: number;
  repeatCount: number;
  turnover: number;
};

type ModuleCardProps = {
  title: string;
  description: string;
  icon: string;
  href: string;
};

const emptyWcSummary: WcEndpointSummary = {
  newCount: 0,
  repeatCount: 0,
  turnover: 0,
};

function sumTeamRows(records: SellerTeamatesWC[]): WcEndpointSummary {
  return records.reduce<WcEndpointSummary>(
    (acc, record) => ({
      newCount: acc.newCount + parseLocaleNumber(record.NEW),
      repeatCount: acc.repeatCount + parseLocaleNumber(record.REP),
      turnover: acc.turnover + parseLocaleNumber(record.TURNOVER),
    }),
    emptyWcSummary,
  );
}

function wcSummaryToChartData(summary: WcEndpointSummary): StoxoiMina {
  const total = summary.newCount + summary.repeatCount;
  const newShare = total > 0 ? summary.newCount / total : 0;
  const amountNew = summary.turnover * newShare;

  return {
    count_paragg_new: summary.newCount,
    count_paragg_repeat: summary.repeatCount,
    amount_paragg_new: amountNew,
    amount_paragg_repeat: summary.turnover - amountNew,
  };
}

function ModuleCard({ title, description, icon, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="text-decoration-none text-reset d-block h-100"
      aria-label={`${title} — μετάβαση`}
    >
      <div
        className="app-card app-card-pressable h-100 p-3"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-body-tertiary flex-shrink-0"
            style={{ width: 40, height: 40 }}
          >
            <i className={`bi ${icon}`} style={{ fontSize: "1.15rem" }} />
          </div>
          <i
            className="bi bi-chevron-right text-secondary"
            style={{ fontSize: "1.1rem" }}
            aria-hidden
          />
        </div>

        <div className="mt-3">
          <div className="fw-semibold">{title}</div>
          <div className="small text-secondary mt-1">{description}</div>
        </div>
      </div>
    </Link>
  );
}

function WcMonthCard() {
  const userInfos = useAppSelector((s) => s.auth.userInfos);
  const isManager = isManagerWithoutSellerRole(userInfos);
  const loggedSellerCode = normalizeSellerCode(userInfos?.sellerCode);
  const [summary, setSummary] =
    React.useState<WcEndpointSummary>(emptyWcSummary);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userInfos) return;

    let alive = true;

    async function loadWcSummary() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/wc/teamates", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data = await parseProxyJson<GetWcTeamatesSuccess>(
          res,
          "Failed to load WC sales summary",
        );
        if (!alive) return;

        const records = data.records ?? [];

        if (isManager) {
          setSummary(sumTeamRows(records));
          return;
        }

        const sellerRecord =
          records.find(
            (record) =>
              normalizeSellerCode(record.SELLERCODE) === loggedSellerCode,
          ) ??
          records[0] ??
          null;

        setSummary(
          sellerRecord
            ? {
                newCount: parseLocaleNumber(sellerRecord.NEW),
                repeatCount: parseLocaleNumber(sellerRecord.REP),
                turnover: parseLocaleNumber(sellerRecord.TURNOVER),
              }
            : emptyWcSummary,
        );
      } catch (err) {
        if (!alive) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load WC sales summary";
        setSummary(emptyWcSummary);
        setError(message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadWcSummary();

    return () => {
      alive = false;
    };
  }, [userInfos, isManager, loggedSellerCode]);

  return (
    <Link
      href="/salesWC"
      className="text-decoration-none text-reset d-block"
      aria-label="WC μήνας — μετάβαση στις πωλήσεις WC"
    >
      <div
        className="app-card app-card-pressable p-3"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <div className="fw-semibold">Πωλήσεις WC</div>
            <div className="small text-secondary">
              Νέες και επαναλαμβανόμενες παραγγελίες
            </div>
          </div>
          <i className="bi bi-chevron-right text-secondary" aria-hidden />
        </div>
        {loading ? (
          <div className="small text-secondary mt-3">Φόρτωση...</div>
        ) : (
          <WcDistributionCharts wc={wcSummaryToChartData(summary)} />
        )}
        {error ? (
          <div className="small text-danger mt-2">
            Δεν φορτώθηκαν τα στοιχεία WC.
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function HomeStats() {
  return (
    <div
      className="d-flex flex-column h-100"
      style={{
        minHeight: 0,
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="row g-3 mb-3">
        <div className="col-md-6 col-12">
          <ModuleCard
            title="Διαδικασία WC"
            description="Ημερολόγιο και ενέργειες για επόμενες παραγγελίες WC."
            icon="bi-calendar-check"
            href="/diadikasia-wc"
          />
        </div>
        <div className="col-md-6 col-12">
          <ModuleCard
            title="Πωλήσεις WC"
            description="Λίστες πωλήσεων, συνεργατών και αποστολών."
            icon="bi-receipt"
            href="/salesWC"
          />
        </div>
        <div className="col-md-6 col-12">
          <ModuleCard
            title="Power BI"
            description="Αναφορές πωλήσεων και διαθέσιμα datasets."
            icon="bi-bar-chart"
            href="/powerbi/seller-reports"
          />
        </div>
        <div className="col-md-6 col-12">
          <ModuleCard
            title="Ρυθμίσεις"
            description="Προτιμήσεις εμφάνισης και λογαριασμού."
            icon="bi-gear"
            href="/settings"
          />
        </div>
      </div>

      <WcMonthCard />
    </div>
  );
}
