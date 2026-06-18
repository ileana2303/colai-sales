"use client";

import Image from "next/image";
import React from "react";
import { Alert } from "react-bootstrap";

import AppLoader from "@/components/ui/AppLoader";
import { CollapsibleAppTile } from "@/components/ui/CollapsibleAppTile";
import { SearchBar } from "@/components/ui/SearchBar";
import TrackingTraceAccordion from "@/features/salesWC/TrackingTraceAccordion";
import { parseProxyJson } from "@/lib/api/client";
import {
  isManagerWithoutSellerRole,
  normalizeSellerCode,
} from "@/lib/sellerAccess";
import { formatElGRDateShort, parseLocalDateTimeMs } from "@/lib/utils/date";
import {
  formatCurrencyGR,
  formatCurrencyWithEuro,
  parseLocaleNumber,
} from "@/lib/utils/number";
import {
  displayMetric,
  displayValue,
  normalizeSearchText,
} from "@/lib/utils/string";
import { useAppSelector } from "@/store/hooks";
import type {
  GetWcOrderListSuccess,
  GetWcTeamatesSuccess,
  SellerSalesWC,
  SellerTeamatesWC,
} from "@/types/api";

type SortMode = "date" | "newrep";

type SellerOrderDetailsState = {
  loading: boolean;
  error: string | null;
  records: SellerSalesWC[] | null;
};

function getColaiMarkerKind(value: unknown): "manual" | "app" | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const numeric = Number(text.replace(",", "."));
  if (Number.isFinite(numeric) && numeric === 0) return "manual";

  return "app";
}

function isZeroColai(value: unknown): boolean {
  const text = String(value ?? "").trim();
  const numeric = Number(text.replace(",", "."));
  return Number.isFinite(numeric) && numeric === 0;
}

function getNewRepKind(value: unknown): "new" | "repeat" | "other" {
  const text = String(value ?? "").trim();
  if (text === "Νέο") return "new";
  if (text === "Επαναληπτικό") return "repeat";
  return "other";
}

function getNewRepBadgeClass(kind: ReturnType<typeof getNewRepKind>): string {
  if (kind === "new") {
    return "text-bg-danger";
  }

  if (kind === "repeat") {
    return "text-bg-success";
  }

  return "bg-body-tertiary text-secondary border";
}

function getNewRepSortRank(value: unknown): number {
  const kind = getNewRepKind(value);
  if (kind === "new") return 0;
  if (kind === "repeat") return 1;
  return 2;
}

function matchesQuery(sale: SellerSalesWC, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  return [
    sale.RegistrationDate,
    sale.SellerCode,
    sale.NEWREP,
    sale.ADCode,
    sale.ReferenceDocument,
    sale.TrackingNo,
    sale.Doctor,
    sale.CustomerName,
    sale.COLAI,
    sale.Turnover,
  ]
    .map((value) => normalizeSearchText(displayValue(value)))
    .join(" ")
    .includes(q);
}

function matchesTeamQuery(sale: SellerTeamatesWC, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  return [
    sale.SELLERCODE,
    sale.SellerName,
    sale.NEW,
    sale.REP,
    sale.TOT,
    sale.TURNOVER,
  ]
    .map((value) => normalizeSearchText(displayValue(value)))
    .join(" ")
    .includes(q);
}

function getSaleTileKey(sale: SellerSalesWC, index: number): string {
  return [
    sale.ReferenceDocument,
    sale.TrackingNo,
    sale.ADCode,
    sale.RegistrationDate,
    sale.CustomerName,
    index,
  ]
    .map((value) => String(value ?? "").trim())
    .join("-");
}

function getTeamTileKey(sale: SellerTeamatesWC, index: number): string {
  return [sale.SELLERCODE, sale.SellerName, index]
    .map((value) => String(value ?? "").trim())
    .join("-");
}

function getSellerStateKey(sellerCode: unknown): string {
  return normalizeSellerCode(sellerCode) || String(sellerCode ?? "").trim();
}

function hasTrackingNumber(value: unknown): boolean {
  const text = String(value ?? "").trim();
  return text !== "" && text !== "-";
}

function buildSaleDetailRows(sale: SellerSalesWC) {
  return [
    {
      icon: "bi-calendar3",
      label: "Ημερομηνία",
      value: formatElGRDateShort(sale.RegistrationDate),
    },
    {
      icon: "bi-file-earmark-text",
      label: "Παραστατικό",
      value: sale.ReferenceDocument,
    },
    { icon: "bi-upc-scan", label: "AD Code", value: sale.ADCode },
    ...(isZeroColai(sale.COLAI)
      ? []
      : [{ icon: "bi-phone", label: "COLAI", value: sale.COLAI }]),
  ];
}

function SaleExpandedDetails({ sale }: { sale: SellerSalesWC }) {
  const details = buildSaleDetailRows(sale);
  const trackingNo = String(sale.TrackingNo ?? "").trim();

  return (
    <div className="d-flex flex-column">
      {hasTrackingNumber(trackingNo) ? (
        <TrackingTraceAccordion voucher={trackingNo} showDivider />
      ) : (
        <DetailRow
          icon="bi-truck"
          label="Tracking"
          value={sale.TrackingNo}
          showDivider
        />
      )}
      <DetailRow
        icon={details[0].icon}
        label={details[0].label}
        value={details[0].value}
        showDivider
      />
      <DetailRow
        icon={details[1].icon}
        label={details[1].label}
        value={details[1].value}
        showDivider
      />
      {details.slice(2).map((detail, index, rest) => (
        <DetailRow
          key={detail.label}
          icon={detail.icon}
          label={detail.label}
          value={detail.value}
          showDivider={index < rest.length - 1}
        />
      ))}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  showDivider,
}: {
  icon: string;
  label: string;
  value: unknown;
  showDivider: boolean;
}) {
  return (
    <div
      className="d-flex align-items-start justify-content-between gap-3 py-2"
      style={
        showDivider
          ? { borderBottom: "1px solid var(--bs-border-color-translucent)" }
          : undefined
      }
    >
      <div
        className="text-secondary d-flex align-items-center flex-shrink-0 gap-1"
        style={{ fontSize: 12 }}
      >
        <i className={`bi ${icon}`} aria-hidden />
        <span>{label}</span>
      </div>
      <div
        className="fw-medium text-break text-end"
        style={{ color: "var(--bs-body-color)", fontSize: 13, minWidth: 0 }}
      >
        {displayValue(value)}
      </div>
    </div>
  );
}

function SalesWCCard({
  sale,
  open,
  onOpenChange,
}: {
  sale: SellerSalesWC;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const colaiMarker = getColaiMarkerKind(sale.COLAI);
  const newRepKind = getNewRepKind(sale.NEWREP);
  const newRepLabel = displayValue(sale.NEWREP);
  const turnover = formatCurrencyWithEuro(sale.Turnover);

  return (
    <CollapsibleAppTile
      open={open}
      onOpenChange={onOpenChange}
      summary={(expanded) => (
        <div className="w-100" style={{ minWidth: 0 }}>
          <div
            className="d-flex align-items-center flex-nowrap gap-1"
            style={{ minWidth: 0 }}
          >
            <span
              className="fw-semibold text-truncate"
              style={{
                color: "var(--bs-body-color)",
                fontSize: 15,
                minWidth: 0,
              }}
            >
              {displayValue(sale.CustomerName)}
            </span>
            <span className="text-secondary flex-shrink-0">-</span>
            <span
              className="text-secondary text-truncate"
              style={{ fontSize: 13, minWidth: 0 }}
            >
              {displayValue(sale.Doctor)}
            </span>
          </div>
          <div className="d-flex align-items-center mt-2 gap-2">
            <div
              className="d-flex align-items-center flex-wrap gap-1"
              style={{ minWidth: 0 }}
            >
              {colaiMarker ? (
                <span
                  className="badge rounded-pill bg-body-tertiary text-secondary d-inline-flex align-items-center justify-content-center flex-shrink-0 border"
                  title={
                    colaiMarker === "app"
                      ? "Παραγγελία από την εφαρμογή"
                      : "Χωρίς COLAI"
                  }
                  aria-label={
                    colaiMarker === "app"
                      ? "Παραγγελία από την εφαρμογή"
                      : "COLAI 0"
                  }
                  style={{
                    fontSize: 12,
                    minWidth: 22,
                    minHeight: 20,
                    paddingInline: colaiMarker === "app" ? 3 : 7,
                  }}
                >
                  {colaiMarker === "app" ? (
                    <Image
                      src="/logo-icon.svg"
                      alt=""
                      width={16}
                      height={16}
                      aria-hidden
                    />
                  ) : (
                    "@"
                  )}
                </span>
              ) : null}
              <span
                className={`badge rounded-pill ${getNewRepBadgeClass(newRepKind)}`}
                style={{ fontSize: 12 }}
              >
                {newRepLabel}
              </span>
              <span
                className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center gap-1 border"
                style={{ fontSize: 12 }}
              >
                <i className="bi bi-cash-coin text-secondary" aria-hidden />
                <span className="text-secondary fw-medium">Ποσό:</span>
                <span className="fw-semibold">{turnover}</span>
              </span>
            </div>
            <i
              className="bi bi-chevron-down text-secondary d-inline-block ms-auto flex-shrink-0"
              style={{
                fontSize: "1rem",
                transition: "transform 160ms ease",
                transform: expanded ? "rotate(-180deg)" : "none",
              }}
              aria-hidden
            />
          </div>
        </div>
      )}
    >
      <SaleExpandedDetails sale={sale} />
    </CollapsibleAppTile>
  );
}

function SellerOrderDetails({
  state,
  onRetry,
}: {
  state: SellerOrderDetailsState | undefined;
  onRetry: () => void;
}) {
  const records = state?.records ?? [];

  if (state?.loading && !records.length) {
    return (
      <div className="d-flex align-items-center text-secondary gap-2 py-2">
        <span className="spinner-border spinner-border-sm" aria-hidden />
        <span style={{ fontSize: 13 }}>Φόρτωση αναλυτικών πωλήσεων...</span>
      </div>
    );
  }

  if (state?.error) {
    return (
      <Alert variant="danger" className="mb-0 py-2">
        <div style={{ fontSize: 13 }}>{state.error}</div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger mt-2"
          onClick={onRetry}
        >
          Δοκιμή ξανά
        </button>
      </Alert>
    );
  }

  if (!records.length) {
    return (
      <div className="text-secondary py-2 text-center" style={{ fontSize: 13 }}>
        Δεν βρέθηκαν αναλυτικές πωλήσεις.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {records.map((record, index) => {
        const colaiMarker = getColaiMarkerKind(record.COLAI);
        const newRepKind = getNewRepKind(record.NEWREP);
        const newRepLabel = displayValue(record.NEWREP);
        const turnover = formatCurrencyWithEuro(record.Turnover);

        return (
          <CollapsibleAppTile
            key={[
              record.ReferenceDocument,
              record.TrackingNo,
              record.CustomerName,
              index,
            ].join("-")}
            inset="compact"
            className="app-card-soft"
            summary={(expanded) => (
              <div className="w-100" style={{ minWidth: 0 }}>
                <div
                  className="d-flex align-items-center flex-nowrap gap-1"
                  style={{ minWidth: 0 }}
                >
                  <span
                    className="fw-semibold text-truncate"
                    style={{
                      color: "var(--bs-body-color)",
                      fontSize: 14,
                      minWidth: 0,
                    }}
                  >
                    {displayValue(record.CustomerName)}
                  </span>
                  <span className="text-secondary flex-shrink-0">-</span>
                  <span
                    className="text-secondary text-truncate"
                    style={{ fontSize: 12, minWidth: 0 }}
                  >
                    {displayValue(record.Doctor)}
                  </span>
                </div>
                <div className="d-flex align-items-center mt-2 gap-2">
                  <div
                    className="d-flex align-items-center flex-wrap gap-1"
                    style={{ minWidth: 0 }}
                  >
                    {colaiMarker ? (
                      <span
                        className="badge rounded-pill bg-body-tertiary text-secondary d-inline-flex align-items-center justify-content-center flex-shrink-0 border"
                        title={
                          colaiMarker === "app"
                            ? "Παραγγελία από την εφαρμογή"
                            : "Χωρίς COLAI"
                        }
                        aria-label={
                          colaiMarker === "app"
                            ? "Παραγγελία από την εφαρμογή"
                            : "COLAI 0"
                        }
                        style={{
                          fontSize: 12,
                          minWidth: 22,
                          minHeight: 20,
                          paddingInline: colaiMarker === "app" ? 3 : 7,
                        }}
                      >
                        {colaiMarker === "app" ? (
                          <Image
                            src="/logo-icon.svg"
                            alt=""
                            width={16}
                            height={16}
                            aria-hidden
                          />
                        ) : (
                          "@"
                        )}
                      </span>
                    ) : null}
                    <span
                      className={`badge rounded-pill ${getNewRepBadgeClass(newRepKind)}`}
                      style={{ fontSize: 12 }}
                    >
                      {newRepLabel}
                    </span>
                    <span
                      className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center gap-1 border"
                      style={{ fontSize: 12 }}
                    >
                      <i
                        className="bi bi-cash-coin text-secondary"
                        aria-hidden
                      />
                      <span className="text-secondary fw-medium">Ποσό:</span>
                      <span className="fw-semibold">{turnover}</span>
                    </span>
                  </div>
                  <i
                    className="bi bi-chevron-down text-secondary d-inline-block ms-auto flex-shrink-0"
                    style={{
                      fontSize: "1rem",
                      transition: "transform 160ms ease",
                      transform: expanded ? "rotate(-180deg)" : "none",
                    }}
                    aria-hidden
                  />
                </div>
              </div>
            )}
          >
            <SaleExpandedDetails sale={record} />
          </CollapsibleAppTile>
        );
      })}
      {state?.loading ? (
        <div className="text-secondary pt-2" style={{ fontSize: 12 }}>
          Ενημέρωση...
        </div>
      ) : null}
    </div>
  );
}

function TeamSalesCard({
  sale,
  open,
  onOpenChange,
  orderState,
  onRetryOrders,
}: {
  sale: SellerTeamatesWC;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderState: SellerOrderDetailsState | undefined;
  onRetryOrders: () => void;
}) {
  return (
    <CollapsibleAppTile
      open={open}
      onOpenChange={onOpenChange}
      summary={(expanded) => (
        <div className="w-100" style={{ minWidth: 0 }}>
          <div
            className="d-flex align-items-center flex-nowrap gap-2"
            style={{ minWidth: 0 }}
          >
            <div
              className="d-flex align-items-center flex-nowrap gap-1"
              style={{ minWidth: 0 }}
            >
              <span
                className="fw-semibold text-truncate"
                style={{
                  color: "var(--bs-body-color)",
                  fontSize: 15,
                  minWidth: 0,
                }}
              >
                {displayValue(sale.SellerName)}
              </span>
              <span className="text-secondary flex-shrink-0">-</span>
              <span
                className="text-secondary text-truncate"
                style={{ fontSize: 13, minWidth: 0 }}
              >
                {displayValue(sale.SELLERCODE)}
              </span>
            </div>
            <span
              className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center ms-auto flex-shrink-0 gap-1 border"
              style={{ fontSize: 12 }}
            >
              <i className="bi bi-cash-coin text-secondary" aria-hidden />
              <span className="fw-semibold">
                {formatCurrencyWithEuro(sale.TURNOVER)}
              </span>
            </span>
          </div>
          <div className="d-flex align-items-center mt-2 gap-2">
            <div
              className="d-flex align-items-center flex-wrap gap-1"
              style={{ minWidth: 0 }}
            >
              <span
                className="badge rounded-pill text-bg-danger d-inline-flex align-items-center gap-1"
                style={{ fontSize: 12 }}
              >
                <span className="fw-medium">N:</span>
                <span className="fw-semibold">{displayMetric(sale.NEW)}</span>
              </span>
              <span
                className="badge rounded-pill text-bg-success d-inline-flex align-items-center gap-1"
                style={{ fontSize: 12 }}
              >
                <span className="fw-medium">E:</span>
                <span className="fw-semibold">{displayMetric(sale.REP)}</span>
              </span>
              <span
                className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center gap-1 border"
                style={{ fontSize: 12 }}
              >
                <span className="text-secondary fw-medium">Σύνολο:</span>
                <span className="fw-semibold">{displayMetric(sale.TOT)}</span>
              </span>
            </div>
            <i
              className="bi bi-chevron-down text-secondary d-inline-block ms-auto flex-shrink-0"
              style={{
                fontSize: "1rem",
                transition: "transform 160ms ease",
                transform: expanded ? "rotate(-180deg)" : "none",
              }}
              aria-hidden
            />
          </div>
        </div>
      )}
    >
      <SellerOrderDetails state={orderState} onRetry={onRetryOrders} />
    </CollapsibleAppTile>
  );
}

export default function SalesWCPage() {
  const userInfos = useAppSelector((s) => s.auth.userInfos);
  const loggedSellerCode = userInfos?.sellerCode;
  const isManagerMode = isManagerWithoutSellerRole(userInfos);
  const [records, setRecords] = React.useState<SellerSalesWC[]>([]);
  const [teamRecords, setTeamRecords] = React.useState<SellerTeamatesWC[]>([]);
  const [summaryRecord, setSummaryRecord] =
    React.useState<SellerTeamatesWC | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SortMode>("date");
  const [openTiles, setOpenTiles] = React.useState<Record<string, boolean>>({});
  const [orderDetailsBySeller, setOrderDetailsBySeller] = React.useState<
    Record<string, SellerOrderDetailsState>
  >({});

  const loadSales = React.useCallback(async () => {
    setLoading(true);

    setError(null);

    try {
      if (isManagerMode) {
        const res = await fetch("/api/wc/teamates", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data = await parseProxyJson<GetWcTeamatesSuccess>(
          res,
          "Failed to load seller team",
        );

        setTeamRecords(data.records ?? []);
        setRecords([]);
        setSummaryRecord(null);
        return;
      }

      const [orderRes, teamatesRes] = await Promise.all([
        fetch("/api/wc/order-list", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }),
        fetch("/api/wc/teamates", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }),
      ]);
      const [orderData, teamatesData] = await Promise.all([
        parseProxyJson<GetWcOrderListSuccess>(
          orderRes,
          "Failed to load seller sales",
        ),
        parseProxyJson<GetWcTeamatesSuccess>(
          teamatesRes,
          "Failed to load seller summary",
        ),
      ]);
      const teamatesRecords = teamatesData.records ?? [];
      const normalizedLoggedSellerCode = normalizeSellerCode(loggedSellerCode);

      setTeamRecords([]);
      setRecords(orderData.records ?? []);
      setSummaryRecord(
        teamatesRecords.find(
          (record) =>
            normalizeSellerCode(record.SELLERCODE) ===
            normalizedLoggedSellerCode,
        ) ??
          teamatesRecords[0] ??
          null,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load seller sales";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isManagerMode, loggedSellerCode]);

  const loadOrderDetails = React.useCallback(
    async (sellerCode: string, force = false) => {
      const sellerKey = getSellerStateKey(sellerCode);
      if (!sellerKey) return;

      const existing = orderDetailsBySeller[sellerKey];
      if (!force && (existing?.loading || existing?.records)) return;

      setOrderDetailsBySeller((prev) => ({
        ...prev,
        [sellerKey]: {
          loading: true,
          error: null,
          records: force ? (prev[sellerKey]?.records ?? null) : null,
        },
      }));

      try {
        const params = new URLSearchParams({ sellerCode: sellerCode.trim() });
        const res = await fetch(`/api/wc/order-list?${params.toString()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data = await parseProxyJson<GetWcOrderListSuccess>(
          res,
          "Failed to load seller order list",
        );

        setOrderDetailsBySeller((prev) => ({
          ...prev,
          [sellerKey]: {
            loading: false,
            error: null,
            records: data.records ?? [],
          },
        }));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load seller order list";
        setOrderDetailsBySeller((prev) => ({
          ...prev,
          [sellerKey]: {
            loading: false,
            error: message,
            records: prev[sellerKey]?.records ?? null,
          },
        }));
      }
    },
    [orderDetailsBySeller],
  );

  React.useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const visibleRecords = React.useMemo(
    () =>
      records
        .filter((sale) => matchesQuery(sale, q))
        .sort((a, b) => {
          if (sortMode === "newrep") {
            const byNewRep =
              getNewRepSortRank(a.NEWREP) - getNewRepSortRank(b.NEWREP);
            if (byNewRep !== 0) return byNewRep;
          }

          return (
            parseLocalDateTimeMs(b.RegistrationDate) -
            parseLocalDateTimeMs(a.RegistrationDate)
          );
        }),
    [q, records, sortMode],
  );

  const visibleTeamRecords = React.useMemo(
    () =>
      teamRecords
        .filter((sale) => matchesTeamQuery(sale, q))
        .sort((a, b) => {
          const byTurnover =
            parseLocaleNumber(b.TURNOVER) - parseLocaleNumber(a.TURNOVER);
          if (byTurnover !== 0) return byTurnover;

          return displayValue(a.SellerName).localeCompare(
            displayValue(b.SellerName),
            "el-GR",
          );
        }),
    [q, teamRecords],
  );

  const summary = React.useMemo(
    () => ({
      newCount: displayMetric(summaryRecord?.NEW),
      repeatCount: displayMetric(summaryRecord?.REP),
      turnoverTotal: parseLocaleNumber(summaryRecord?.TURNOVER),
    }),
    [summaryRecord],
  );

  const visibleTileKeys = React.useMemo(
    () =>
      isManagerMode
        ? visibleTeamRecords.map((sale, index) => getTeamTileKey(sale, index))
        : visibleRecords.map((sale, index) => getSaleTileKey(sale, index)),
    [isManagerMode, visibleRecords, visibleTeamRecords],
  );
  const allTilesExpanded =
    visibleTileKeys.length > 0 &&
    visibleTileKeys.every((key) => !!openTiles[key]);

  const toggleVisibleTiles = React.useCallback(() => {
    const nextOpen = !allTilesExpanded;
    setOpenTiles((prev) => {
      const next = { ...prev };
      for (const key of visibleTileKeys) next[key] = nextOpen;
      return next;
    });
    if (nextOpen && isManagerMode) {
      for (const sale of visibleTeamRecords) {
        void loadOrderDetails(sale.SELLERCODE);
      }
    }
  }, [
    allTilesExpanded,
    isManagerMode,
    loadOrderDetails,
    visibleTeamRecords,
    visibleTileKeys,
  ]);

  const visibleCount = isManagerMode
    ? visibleTeamRecords.length
    : visibleRecords.length;
  const showInitialLoader =
    loading &&
    (isManagerMode ? teamRecords.length === 0 : records.length === 0);

  return (
    <>
      <div className="app-card mb-3 p-3">
        <div className="d-flex align-items-start gap-3">
          <div className="w-100" style={{ minWidth: 0 }}>
            <div
              className="d-flex flex-column align-items-center flex-md-row flex-md-nowrap align-items-md-center text-md-start gap-md-2 gap-2 text-center"
              style={{ minWidth: 0 }}
            >
              <div className="h5 fw-bold mb-0 flex-shrink-0">
                Αποτέλεσμα WC 30 ημερών
              </div>
              {!isManagerMode ? (
                <div className="d-flex align-items-center justify-content-center ms-md-auto flex-shrink-0 gap-1">
                  <span
                    className="badge rounded-pill text-bg-danger d-inline-flex align-items-center gap-1"
                    aria-label={`Νέο ${summary.newCount}`}
                    style={{ fontSize: 12 }}
                  >
                    <span className="fw-medium">N:</span>
                    <span className="fw-semibold">{summary.newCount}</span>
                  </span>
                  <span
                    className="badge rounded-pill text-bg-success d-inline-flex align-items-center gap-1"
                    aria-label={`Επαναληπτικό ${summary.repeatCount}`}
                    style={{ fontSize: 12 }}
                  >
                    <span className="fw-medium">E:</span>
                    <span className="fw-semibold">{summary.repeatCount}</span>
                  </span>
                  <span
                    className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center gap-1 border"
                    aria-label={`Σύνολο ${formatCurrencyGR(summary.turnoverTotal)} ευρώ`}
                    style={{ fontSize: 12 }}
                  >
                    <span className="text-secondary fw-medium">Σύνολο:</span>
                    <span className="fw-semibold">
                      {formatCurrencyGR(summary.turnoverTotal)}€
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
        <div className="app-card flex-grow-1">
          <SearchBar
            placeholder="Αναζήτηση"
            value={q}
            onChange={setQ}
            onClear={() => setQ("")}
          />
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={toggleVisibleTiles}
          disabled={!visibleTileKeys.length}
        >
          <i
            className={`bi ${allTilesExpanded ? "bi-arrows-collapse" : "bi-arrows-expand"}`}
            aria-hidden
          />
          <span className="visually-hidden">
            {allTilesExpanded ? "Σύμπτυξη όλων" : "Ανάπτυξη όλων"}
          </span>
        </button>
        {!isManagerMode ? (
          <button
            type="button"
            className={`btn btn-sm d-inline-flex align-items-center flex-shrink-0 gap-1 ${
              sortMode === "newrep" ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() =>
              setSortMode((current) =>
                current === "newrep" ? "date" : "newrep",
              )
            }
            aria-pressed={sortMode === "newrep"}
            aria-label={
              sortMode === "newrep"
                ? "Ταξινόμηση ανά ημερομηνία"
                : "Ταξινόμηση ανά NEWREP"
            }
            title={
              sortMode === "newrep"
                ? "Πατήστε για ταξινόμηση ανά ημερομηνία"
                : "Πατήστε για ταξινόμηση ανά NEWREP"
            }
          >
            <i
              className={`bi ${sortMode === "newrep" ? "bi-filter" : "bi-sort-down"}`}
              aria-hidden
            />
            <span className="text-nowrap">
              {sortMode === "newrep" ? "Ημ/νία" : "Νέες"}
            </span>
          </button>
        ) : null}
      </div>

      <div>
        {error ? (
          <Alert variant="danger" className="mb-3">
            <div>{error}</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={() => void loadSales()}
            >
              Δοκιμή ξανά
            </button>
          </Alert>
        ) : showInitialLoader ? (
          <AppLoader label="Φόρτωση πωλήσεων..." />
        ) : visibleCount ? (
          <div className="d-flex flex-column gap-2">
            {isManagerMode
              ? visibleTeamRecords.map((sale, index) => {
                  const tileKey = getTeamTileKey(sale, index);
                  const sellerStateKey = getSellerStateKey(sale.SELLERCODE);
                  return (
                    <TeamSalesCard
                      key={tileKey}
                      sale={sale}
                      open={!!openTiles[tileKey]}
                      onOpenChange={(open) => {
                        setOpenTiles((prev) => ({ ...prev, [tileKey]: open }));
                        if (open) void loadOrderDetails(sale.SELLERCODE);
                      }}
                      orderState={orderDetailsBySeller[sellerStateKey]}
                      onRetryOrders={() =>
                        void loadOrderDetails(sale.SELLERCODE, true)
                      }
                    />
                  );
                })
              : visibleRecords.map((sale, index) => {
                  const tileKey = getSaleTileKey(sale, index);
                  return (
                    <SalesWCCard
                      key={tileKey}
                      sale={sale}
                      open={!!openTiles[tileKey]}
                      onOpenChange={(open) =>
                        setOpenTiles((prev) => ({ ...prev, [tileKey]: open }))
                      }
                    />
                  );
                })}
          </div>
        ) : (
          <div className="app-card text-secondary p-3 text-center">
            Δεν βρέθηκαν πωλήσεις.
          </div>
        )}
      </div>
    </>
  );
}
