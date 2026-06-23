"use client";

import React from "react";

import { AppIcon } from "@/components/ui/app-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSalesPerYearReport } from "@/features/powerBI/hooks/usePowerBiReports";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import {
  MetricCard,
  ReportHeader,
  ReportToneValue,
  TargetBar,
  ValuePill,
} from "@/features/powerBI/ReportShared";
import {
  formatNullableCurrency,
  formatNullableNumber,
  formatNullableRatioPercent,
  getCoverRatioTone,
  getSignedValueTone,
  getTargetGapTone,
  getValueToneClassName,
  getMonthIndex,
  getMonthLabel,
  type ValueTone,
} from "@/lib/bi-reports/reportUtils";
import { cn } from "@/lib/utils";
import type {
  SalesPerYearCoverSummary,
  SalesPerYearMonthlyRow,
  SalesPerYearRow,
} from "@/lib/bi-reports/biReports";

function getCurrentAthensMonthIndex() {
  const month = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "Europe/Athens",
  }).format(new Date());

  return Number(month) - 1;
}

function ReportSectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="app-card p-5">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

function SalesPerYearTargetPanel({
  title,
  subtitle,
  icon,
  accent,
  actualLabel,
  actual,
  target,
  forecast,
  coverage,
  formatValue,
}: {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  actualLabel: string;
  actual: number | null;
  target: number | null;
  forecast?: number | null;
  coverage?: number | null;
  formatValue: (value: number | null) => string;
}) {
  const ratio =
    coverage ??
    (actual != null && target != null && target > 0 ? actual / target : null);
  const width = ratio == null ? 0 : Math.min(100, Math.max(0, ratio * 100));
  const ratioTone = getCoverRatioTone(ratio);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 36,
                height: 36,
                background: `${accent}1f`,
                color: accent,
              }}
            >
              <AppIcon name={icon} size={16} />
            </span>
            <div className="min-w-0">
              <div className="font-bold truncate">{title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {subtitle}
              </div>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium",
            getValueToneClassName(ratioTone),
          )}
          style={{
            background: `${accent}1f`,
            color: ratioTone ? undefined : accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(ratio)}
        </span>
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-3">
        <div>
          <ValuePill label={actualLabel} value={formatValue(actual)} />
        </div>
        <div>
          <ValuePill label="Στόχος" value={formatValue(target)} />
        </div>
        {forecast !== undefined ? (
          <div className="col-span-2">
            <ValuePill label="Forecast" value={formatValue(forecast)} />
          </div>
        ) : null}
      </div>

      <div
        className="rounded-full bg-muted mt-3"
        style={{ height: 9, overflow: "hidden" }}
        role="presentation"
      >
        <div
          className="rounded-full h-full"
          style={{
            width: `${width}%`,
            background: ratio != null && ratio >= 1 ? "#16a34a" : accent,
          }}
        />
      </div>
    </div>
  );
}

function SalesPerYearProductCard({
  title,
  sales,
  target,
  coverage,
  accent,
}: {
  title: string;
  sales: number | null;
  target: number | null;
  coverage: number | null;
  accent: string;
}) {
  const coverageTone = getCoverRatioTone(coverage);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{title}</div>
          <div className="text-sm text-muted-foreground">Πωλήσεις vs στόχος</div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium",
            getValueToneClassName(coverageTone),
          )}
          style={{
            background: `${accent}1f`,
            color: coverageTone ? undefined : accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(coverage)}
        </span>
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-2">
        <div>
          <ValuePill label="Πωλήσεις" value={formatNullableCurrency(sales)} />
        </div>
        <div>
          <ValuePill label="Στόχος" value={formatNullableCurrency(target)} />
        </div>
      </div>

      <div className="mt-3">
        <TargetBar
          label="Κάλυψη"
          actual={sales}
          target={target}
          coverage={coverage}
          accent={accent}
          formatValue={formatNullableCurrency}
        />
      </div>
    </div>
  );
}

function SalesPerYearCoverSummaryCards({
  summary,
}: {
  summary: SalesPerYearCoverSummary | null;
}) {
  if (!summary) return null;

  return (
    <section className="app-metric-grid">
      <MetricCard
        label="Hospital Trend All"
        value={formatNullableRatioPercent(summary.hospitalCoverAll)}
        icon="bi-hospital"
        accent="#2563eb"
        tone={getCoverRatioTone(summary.hospitalCoverAll)}
      />
      <MetricCard
        label="WC Trend All"
        value={formatNullableRatioPercent(summary.wcCoverAll)}
        icon="bi-clipboard2-pulse"
        accent="#16a34a"
        tone={getCoverRatioTone(summary.wcCoverAll)}
      />
      <MetricCard
        label="CC Trend All"
        value={formatNullableRatioPercent(summary.ccCoverAll)}
        icon="bi-droplet-half"
        accent="#dc2626"
        tone={getCoverRatioTone(summary.ccCoverAll)}
      />
      <MetricCard
        label="Total Trend All"
        value={formatNullableRatioPercent(summary.totalCoverAll)}
        icon="bi-bullseye"
        accent="#7c3aed"
        tone={getCoverRatioTone(summary.totalCoverAll)}
      />
    </section>
  );
}

function SalesPerYearMonthCard({
  row,
  index,
}: {
  row: SalesPerYearMonthlyRow;
  index: number;
}) {
  const accent = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed"][index % 4];
  const coverTone = getCoverRatioTone(row.totalClpSalesCoverCM);

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{getMonthLabel(row.month)}</div>
          <div className="text-sm text-muted-foreground">
            Νοσοκομειακός & εξωνοσοκομειακός τζίρος
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-1 text-[10px] leading-none font-medium",
            getValueToneClassName(coverTone),
          )}
          style={{
            background: `${accent}1f`,
            color: coverTone ? undefined : accent,
            border: `1px solid ${accent}33`,
          }}
        >
          {formatNullableRatioPercent(row.totalClpSalesCoverCM)}
        </span>
      </div>

      <div className="flex flex-col mt-3 gap-3">
        <TargetBar
          label="Hospital Sales"
          actual={row.hospitalSales}
          target={row.hospitalTarget}
          coverage={row.hospitalSalesCoverCM}
          accent="#2563eb"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="Non Hospital Sales WC"
          actual={row.nonHospitalSalesWc}
          target={row.nonHospitalTargetWc}
          coverage={row.wcSalesCoverCM}
          accent="#16a34a"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="Non Hospital Sales CC"
          actual={row.nonHospitalSalesCc}
          target={row.nonHospitalTargetCc}
          coverage={row.ccNhSalesCoverCM}
          accent="#dc2626"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="Total Coloplast Sales"
          actual={row.totalColoplastSales}
          target={row.totalClpTarget}
          coverage={row.totalClpSalesCoverCM}
          accent="#7c3aed"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="Genadyne Sales"
          actual={row.genadyneSales}
          target={row.genadyneTargetSales}
          coverage={row.geSalesCoverCM}
          accent="#0891b2"
          formatValue={formatNullableCurrency}
        />
        <TargetBar
          label="UNO Sales"
          actual={row.unoSales}
          target={row.unoTargetSales}
          coverage={row.unoCover}
          accent="#f97316"
          formatValue={formatNullableCurrency}
        />
      </div>
    </div>
  );
}

function SalesPerYearMonthlyCompactTable({
  rows,
}: {
  rows: SalesPerYearMonthlyRow[];
}) {
  if (!rows.length) return null;

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικά στοιχεία ανά μήνα</div>
          <div className="text-sm text-muted-foreground">
            Καλύψεις στόχου από Power BI
          </div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μήνας</TableHead>
              <TableHead className="text-right">% Hospital</TableHead>
              <TableHead className="text-right">% WC</TableHead>
              <TableHead className="text-right">% CC</TableHead>
              <TableHead className="text-right">% Total CLP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-semibold">
                  {getMonthLabel(row.month)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={getCoverRatioTone(row.hospitalSalesCoverCM)}>
                    {formatNullableRatioPercent(row.hospitalSalesCoverCM)}
                  </ReportToneValue>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={getCoverRatioTone(row.wcSalesCoverCM)}>
                    {formatNullableRatioPercent(row.wcSalesCoverCM)}
                  </ReportToneValue>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={getCoverRatioTone(row.ccNhSalesCoverCM)}>
                    {formatNullableRatioPercent(row.ccNhSalesCoverCM)}
                  </ReportToneValue>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue
                    tone={getCoverRatioTone(row.totalClpSalesCoverCM)}
                  >
                    {formatNullableRatioPercent(row.totalClpSalesCoverCM)}
                  </ReportToneValue>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SalesPerYearMonthlyBreakdown({
  rows,
}: {
  rows: SalesPerYearMonthlyRow[];
}) {
  if (!rows.length) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="app-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Μήνες αναφοράς</div>
            <div className="text-sm text-muted-foreground">
              Από Ιανουάριο έως τον τρέχοντα μήνα
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs text-foreground">
            {rows.length} μήνες
          </span>
        </div>
      </div>

      {rows.map((row, index) => (
        <SalesPerYearMonthCard
          key={`${row.month}-${index}`}
          row={row}
          index={index}
        />
      ))}

      <SalesPerYearMonthlyCompactTable rows={rows} />
    </section>
  );
}

function SalesPerYearDetailsTable({ row }: { row: SalesPerYearRow }) {
  const details: Array<{ label: string; tone?: ValueTone; value: string }> = [
    {
      label: "Total Coloplast Sales",
      value: formatNullableCurrency(row.totalColoplastSales),
    },
    {
      label: "Total CLP Target",
      value: formatNullableCurrency(row.totalClpTarget),
    },
    {
      label: "Total CLP Sales Forecast",
      tone: getTargetGapTone(row.totalClpSalesForecast, row.totalClpTarget),
      value: formatNullableCurrency(row.totalClpSalesForecast),
    },
    {
      label: "% Total CLP Cover",
      tone: getCoverRatioTone(row.totalClpCover),
      value: formatNullableRatioPercent(row.totalClpCover),
    },
    { label: "OC PER", value: formatNullableNumber(row.ocPer) },
    { label: "OC PER Target", value: formatNullableNumber(row.ocPerTarget) },
    {
      label: "OC PER Forecast",
      tone: getTargetGapTone(row.ocPerForecast, row.ocPerTarget),
      value: formatNullableNumber(row.ocPerForecast),
    },
    {
      label: "% OC Cover",
      tone: getCoverRatioTone(row.ocCover),
      value: formatNullableRatioPercent(row.ocCover),
    },
    {
      label: "IC PER NEW",
      tone: getTargetGapTone(row.icPerNew, row.icPerTargetNew),
      value: formatNullableNumber(row.icPerNew),
    },
    {
      label: "IC PER Target New",
      value: formatNullableNumber(row.icPerTargetNew),
    },
    {
      label: "Genadyne Sales",
      value: formatNullableCurrency(row.genadyneSales),
    },
    {
      label: "GENADYNE Target",
      value: formatNullableCurrency(row.genadyneTarget),
    },
    {
      label: "% COVER GENADYNE",
      tone: getCoverRatioTone(row.genadyneCover),
      value: formatNullableRatioPercent(row.genadyneCover),
    },
    { label: "UNO Sales", value: formatNullableCurrency(row.unoSales) },
    {
      label: "UNO Target Sales",
      value: formatNullableCurrency(row.unoTargetSales),
    },
    {
      label: "% COVER UNO",
      tone: getCoverRatioTone(row.unoCover),
      value: formatNullableRatioPercent(row.unoCover),
    },
  ];

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Αναλυτικά στοιχεία</div>
          <div className="text-sm text-muted-foreground">Ετήσιες τιμές από Power BI</div>
        </div>
        <AppIcon name="bi-table" className="text-muted-foreground" size={18} />
      </div>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Μετρική</TableHead>
              <TableHead className="text-right">Τιμή</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="text-muted-foreground">
                  {item.label}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <ReportToneValue tone={item.tone}>{item.value}</ReportToneValue>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SalesPerYearReportPage() {
  const { data, error, isLoading, isError, refetch } = useSalesPerYearReport();

  const records = data?.records ?? [];
  const monthlyRecords = data?.monthlyRecords ?? [];
  const coverSummary = data?.coverSummary ?? null;
  const sellerCode = data?.sellerCode ?? "";
  const sellerName = data?.sellerName ?? "";

  const row = records[0] ?? null;
  const visibleMonthlyRecords = React.useMemo(() => {
    const currentMonthIndex = getCurrentAthensMonthIndex();

    return monthlyRecords.filter((monthlyRow) => {
      const monthIndex = getMonthIndex(monthlyRow.month);
      return monthIndex == null || monthIndex <= currentMonthIndex;
    });
  }, [monthlyRecords]);
  const sellerLabel =
    sellerName || sellerCode
      ? `${sellerName || "Πωλητής"}${sellerCode ? ` • ${sellerCode}` : ""}`
      : "Ετήσια εικόνα πωλήσεων";

  return (
    <div className="app-page">
      <ReportHeader
        title="Πωλήσεις ανά έτος"
        subtitle={sellerLabel}
        icon="bi-graph-up-arrow"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load Power BI sales per year"
        onRetry={() => void refetch()}
      >
        {row ? (
        <>
          <ReportSectionTitle
            title="Εικόνα Πωλήσεων"
            subtitle="Σύνολα, στόχοι, forecast και καλύψεις πωλητή"
          />

          <section className="app-metric-grid">
            <MetricCard
              label="Total Coloplast Sales"
              value={formatNullableCurrency(row.totalColoplastSales)}
              icon="bi-cash-stack"
              accent="#7c3aed"
            />
            <MetricCard
              label="% Total CLP Cover"
              value={formatNullableRatioPercent(row.totalClpCover)}
              icon="bi-bullseye"
              accent="#16a34a"
              tone={getCoverRatioTone(row.totalClpCover)}
            />
            <MetricCard
              label="% OC Cover"
              value={formatNullableRatioPercent(row.ocCover)}
              icon="bi-pie-chart"
              accent="#2563eb"
              tone={getCoverRatioTone(row.ocCover)}
            />
            <MetricCard
              label="IC PER NEW"
              value={formatNullableNumber(row.icPerNew)}
              icon="bi-person-plus"
              accent="#f97316"
              tone={getTargetGapTone(row.icPerNew, row.icPerTargetNew)}
            />
          </section>

          <SalesPerYearTargetPanel
            title="Total Coloplast"
            subtitle="Sales, target και forecast"
            icon="bi-cash-stack"
            accent="#7c3aed"
            actualLabel="Sales"
            actual={row.totalColoplastSales}
            target={row.totalClpTarget}
            forecast={row.totalClpSalesForecast}
            coverage={row.totalClpCover}
            formatValue={formatNullableCurrency}
          />

          <SalesPerYearTargetPanel
            title="OC PER"
            subtitle="PER, target και forecast"
            icon="bi-activity"
            accent="#2563eb"
            actualLabel="OC PER"
            actual={row.ocPer}
            target={row.ocPerTarget}
            forecast={row.ocPerForecast}
            coverage={row.ocCover}
            formatValue={(value) => formatNullableNumber(value)}
          />

          <SalesPerYearTargetPanel
            title="IC PER NEW"
            subtitle="Νέο PER σε σχέση με target"
            icon="bi-person-plus"
            accent="#f97316"
            actualLabel="IC PER NEW"
            actual={row.icPerNew}
            target={row.icPerTargetNew}
            coverage={
              row.icPerNew != null &&
              row.icPerTargetNew != null &&
              row.icPerTargetNew > 0
                ? row.icPerNew / row.icPerTargetNew
                : null
            }
            formatValue={(value) => formatNullableNumber(value)}
          />

          <section className="flex flex-col gap-2">
            <SalesPerYearProductCard
              title="Genadyne"
              sales={row.genadyneSales}
              target={row.genadyneTarget}
              coverage={row.genadyneCover}
              accent="#0891b2"
            />
            <SalesPerYearProductCard
              title="UNO"
              sales={row.unoSales}
              target={row.unoTargetSales}
              coverage={row.unoCover}
              accent="#dc2626"
            />
          </section>

          <SalesPerYearDetailsTable row={row} />

          <ReportSectionTitle
            title="Αποτέλεσμα Νοσοκομειακού & Εξωνοσοκομειακού Τζίρου"
            subtitle="Μηνιαία εικόνα έως τον τρέχοντα μήνα"
          />

          <SalesPerYearCoverSummaryCards summary={coverSummary} />

          <SalesPerYearMonthlyBreakdown rows={visibleMonthlyRecords} />
        </>
        ) : (
        <div className="app-card p-5 text-center text-muted-foreground">
          Δεν βρέθηκαν ετήσια στοιχεία πωλήσεων.
        </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
