import { createReportMatrixSectionSummariesFromPeriodMeta } from "@/features/powerBI/reportMatrixData";
import type { ReportMatrixPeriodSummaryItem } from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import type { AvailableSnapshot } from "@/lib/snapshots/types";

export type { ReportMatrixPeriodSummaryItem };

function formatPeriodSummaryLabel(label: string) {
  return label.toLocaleUpperCase("el-GR");
}

export function buildSnapshotPeriodSummaryItems(
  snapshot: AvailableSnapshot | null | undefined,
): ReportMatrixPeriodSummaryItem[] {
  const summaries = createReportMatrixSectionSummariesFromPeriodMeta(
    snapshot
      ? {
          closedPeriodLabel: snapshot.closed_period_label,
          closedMonthsCount: snapshot.closed_months_count,
          lastClosedMonth: snapshot.last_closed_month,
          openMonthsCount: snapshot.open_months_count,
        }
      : null,
  );

  const previousPeriodSummary = summaries["previous-period"];
  const closedMonthsSummary = summaries["closed-months"];
  const openMonthsSummary = summaries["current-year"];
  const currentMonthSummary = summaries["monthly-target"];

  return [
    previousPeriodSummary
      ? {
          key: "closed-period",
          label: formatPeriodSummaryLabel(String(previousPeriodSummary.label)),
          value: String(previousPeriodSummary.value),
          hint: previousPeriodSummary.details?.[0]
            ? String(previousPeriodSummary.details[0])
            : null,
        }
      : null,
    closedMonthsSummary
      ? {
          key: "closed-months",
          label: formatPeriodSummaryLabel("Κλειστοι μηνες"),
          value: String(closedMonthsSummary.value),
          hint: closedMonthsSummary.details?.[0]
            ? String(closedMonthsSummary.details[0])
            : null,
        }
      : null,
    openMonthsSummary
      ? {
          key: "open-months",
          label: formatPeriodSummaryLabel(String(openMonthsSummary.label)),
          value: String(openMonthsSummary.value),
          hint: openMonthsSummary.details?.[0]
            ? String(openMonthsSummary.details[0])
            : null,
        }
      : null,
    currentMonthSummary
      ? {
          key: "current-month",
          label: formatPeriodSummaryLabel(String(currentMonthSummary.label)),
          value: String(currentMonthSummary.value),
          hint: currentMonthSummary.details?.[0]
            ? String(currentMonthSummary.details[0]).replace(
                /^Κατάσταση:\s*/,
                "",
              )
            : null,
        }
      : null,
  ].filter(Boolean) as ReportMatrixPeriodSummaryItem[];
}
