import * as XLSX from "xlsx";

import {
  downloadXlsxWorkbook,
  getExportFileName,
} from "@/features/powerBI/PowerBiTable/utils";
import type {
  TargetsTrendsGroupMetrics,
  TargetsTrendsMetrics,
} from "@/lib/bi-reports/targetsTrends";
import {
  formatNullableCurrency,
  formatNullableRatioPercent,
} from "@/lib/bi-reports/reportUtils";
import { formatIntGR } from "@/lib/utils/number";

type SummaryRow = {
  label: string;
  value: string;
};

type SummarySection = {
  rows: SummaryRow[];
  title: string;
};

function appendSummarySection(
  sheetRows: string[][],
  section: SummarySection,
) {
  sheetRows.push([section.title]);
  sheetRows.push(["Μετρική", "Τιμή"]);

  for (const row of section.rows) {
    sheetRows.push([row.label, row.value]);
  }

  sheetRows.push([]);
}

function buildClosedMonthsSection(metrics: TargetsTrendsMetrics): SummarySection {
  return {
    title: "Πωλήσεις κλεισμένων μηνών",
    rows: [
      {
        label: "Τελευταίος κλειστός μήνας",
        value: metrics.maxClosedMonth || "-",
      },
      {
        label: "Στόχος (κλειστά)",
        value: formatNullableCurrency(metrics.closedTarget),
      },
      {
        label: "Πωλήσεις (κλειστά)",
        value: formatNullableCurrency(metrics.closedSales),
      },
      {
        label: "Διαφορά",
        value: formatNullableCurrency(metrics.closedDiff),
      },
      {
        label: "Cover %",
        value: formatNullableRatioPercent(metrics.closedCover),
      },
      {
        label: "Πωλήσεις LY (ίδιοι μήνες)",
        value: formatNullableCurrency(metrics.closedSalesLy),
      },
      {
        label: "LY / CY %",
        value: formatNullableRatioPercent(metrics.closedLyCover),
      },
      {
        label: "CY − LY",
        value: formatNullableCurrency(metrics.closedLyDiff),
      },
    ],
  };
}

function buildGapSection(metrics: TargetsTrendsMetrics): SummarySection {
  return {
    title: "Ετήσιος στόχος vs Trend",
    rows: [
      {
        label: "Στόχος 2026 (όλοι οι μήνες)",
        value: formatNullableCurrency(metrics.annualTarget),
      },
      {
        label: "Trend σύνολο",
        value: formatNullableCurrency(metrics.trendTotal),
      },
      {
        label: "Diff gap (Trend − Στόχος)",
        value: formatNullableCurrency(metrics.diffGap),
      },
      {
        label: "Trend / Στόχος %",
        value: formatNullableRatioPercent(metrics.trendCover),
      },
    ],
  };
}

function buildOpenMonthsSection(metrics: TargetsTrendsMetrics): SummarySection {
  return {
    title: "Ανοιχτοί μήνες & extra target",
    rows: [
      {
        label: "Ανοιχτοί μήνες",
        value: formatIntGR(metrics.openMonthCount),
      },
      {
        label: "MIN ανοιχτός μήνας",
        value: metrics.minOpenMonth || "-",
      },
      {
        label: "Στόχος MIN ανοιχτού",
        value: formatNullableCurrency(metrics.minOpenMonthTarget),
      },
      {
        label: "Extra target / μήνα",
        value: formatNullableCurrency(metrics.extraTarget),
      },
      {
        label: "Στόχος + Extra",
        value: formatNullableCurrency(metrics.adjustedOpenTarget),
      },
    ],
  };
}

function appendGroupTable(
  sheetRows: string[][],
  group1Label: string,
  group2Label: string | undefined,
  groupSectionTitle: string,
  groups: TargetsTrendsGroupMetrics[],
) {
  sheetRows.push([groupSectionTitle]);
  sheetRows.push([
    group1Label,
    ...(group2Label ? [group2Label] : []),
    "Team",
    "Πωλητής",
    "Κλειστά VCY",
    "Κλειστά TCY",
    "Cover",
    "LY VCY",
    "Trend",
    "Gap",
  ]);

  for (const row of groups) {
    sheetRows.push([
      row.group1,
      ...(group2Label ? [row.group2 || "-"] : []),
      row.team || "-",
      row.sellerName || row.sellerCode || "-",
      formatNullableCurrency(row.closedSales),
      formatNullableCurrency(row.closedTarget),
      formatNullableRatioPercent(row.closedCover),
      formatNullableCurrency(row.closedSalesLy),
      formatNullableCurrency(row.trendTotal),
      formatNullableCurrency(row.diffGap),
    ]);
  }
}

export function buildTargetsTrendsWorkbook({
  group1Label,
  group2Label,
  groupSectionTitle,
  groups,
  metrics,
}: {
  group1Label: string;
  group2Label?: string;
  groupSectionTitle: string;
  groups: TargetsTrendsGroupMetrics[];
  metrics: TargetsTrendsMetrics;
}) {
  const sheetRows: string[][] = [];

  appendSummarySection(sheetRows, buildClosedMonthsSection(metrics));
  appendSummarySection(sheetRows, buildGapSection(metrics));
  appendSummarySection(sheetRows, buildOpenMonthsSection(metrics));
  appendGroupTable(sheetRows, group1Label, group2Label, groupSectionTitle, groups);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Targets & Trends");

  return workbook;
}

export function exportTargetsTrendsToExcel({
  exportFileName,
  group1Label,
  group2Label,
  groupSectionTitle,
  groups,
  metrics,
  title,
}: {
  exportFileName: string;
  group1Label: string;
  group2Label?: string;
  groupSectionTitle: string;
  groups: TargetsTrendsGroupMetrics[];
  metrics: TargetsTrendsMetrics;
  title: string;
}) {
  downloadXlsxWorkbook(
    buildTargetsTrendsWorkbook({
      group1Label,
      group2Label,
      groupSectionTitle,
      groups,
      metrics,
    }),
    getExportFileName(title, exportFileName),
  );
}
