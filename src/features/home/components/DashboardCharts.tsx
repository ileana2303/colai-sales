"use client";

import { formatCurrencyGR, formatIntGR } from "@/lib/utils/number";
import type { StoxoiMina } from "@/types/api/schemas";

export function WcDistributionCharts({ wc }: { wc: StoxoiMina }) {
  const newC = Math.max(0, wc.count_paragg_new);
  const repC = Math.max(0, wc.count_paragg_repeat);
  const total = newC + repC;
  const pNew = total > 0 ? (newC / total) * 100 : 0;
  const pRep = total > 0 ? (repC / total) * 100 : 0;
  const degNew = total > 0 ? (newC / total) * 360 : 0;

  return (
    <div className="mt-3">
      <div
        className="position-relative mx-auto mb-3"
        style={{ width: 132, height: 132 }}
        role="img"
        aria-label={`Κατανομή παραγγελιών: νέες ${newC}, επαναλήψεις ${repC}`}
      >
        <div
          className="rounded-circle"
          style={{
            width: "100%",
            height: "100%",
            background:
              total === 0
                ? "var(--bs-secondary-bg-subtle)"
                : `conic-gradient(from -90deg, rgba(var(--bs-primary-rgb), 0.95) 0deg ${degNew}deg, rgba(var(--bs-info-rgb), 0.92) ${degNew}deg 360deg)`,
          }}
        />
        <div
          className="position-absolute translate-middle rounded-circle d-flex align-items-center justify-content-center bg-body start-50 top-50 border"
          style={{
            width: "58%",
            height: "58%",
            borderColor: "var(--bs-border-color-translucent)",
          }}
        >
          <span className="small fw-bold text-body">{formatIntGR(total)}</span>
        </div>
      </div>

      <div
        className="rounded-pill d-flex mb-2 overflow-hidden"
        style={{ height: 10 }}
        role="presentation"
        aria-hidden
      >
        <div
          className="bg-primary h-100"
          style={{ width: `${pNew}%`, minWidth: total > 0 && newC > 0 ? 2 : 0 }}
        />
        <div
          className="bg-info h-100"
          style={{ width: `${pRep}%`, minWidth: total > 0 && repC > 0 ? 2 : 0 }}
        />
      </div>

      <div className="d-flex justify-content-between small flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle bg-primary flex-shrink-0"
            style={{ width: 8, height: 8 }}
          />
          <span className="text-secondary">Νέες</span>
          <span className="fw-semibold text-body">{formatIntGR(newC)}</span>
          <span className="text-secondary">
            ({formatCurrencyGR(wc.amount_paragg_new)}€)
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle bg-info flex-shrink-0"
            style={{ width: 8, height: 8 }}
          />
          <span className="text-secondary">Επαναλήψεις</span>
          <span className="fw-semibold text-body">{formatIntGR(repC)}</span>
          <span className="text-secondary">
            ({formatCurrencyGR(wc.amount_paragg_repeat)}€)
          </span>
        </div>
      </div>
    </div>
  );
}
