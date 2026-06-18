"use client";

import React from "react";
import { Modal } from "react-bootstrap";
import type { SearchCustomerTelsData, wcCalendar } from "@/types/wc";
import { wcCalendarTaskCode, wcCustomerGid } from "@/types/wc";
import { fetchCustomerTelsCached } from "@/features/wcDiadikasia/fetchCustomerTels";
import { CollapsibleAppTile } from "@/components/ui/CollapsibleAppTile";
import { formatUIDate } from "@/lib/utils/date";
import { formatCurrencyGR } from "@/lib/utils/number";
import {
  groupWcCalendarByLastOrderDate,
  type WcCalendarGroupOrder,
} from "@/features/wcDiadikasia/groupWcCalendarByLastOrderDate";

function telHref(phone: string): string {
  const digits = phone.trim().replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}
function cleanOptionalText(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text.toLowerCase() === "null" ? "" : text;
}

function getDeliveryInfo(row: wcCalendar) {
  const address = cleanOptionalText(row.deliveryAddress1);
  const city = cleanOptionalText(row.deliveryCity);
  const postal = cleanOptionalText(row.deliveryPostal);

  if (!address && !city && !postal) return null;

  const location = [address, [postal, city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const query = [address, postal, city].filter(Boolean).join(" ");

  return { location, query };
}
type MapAction =
  | {
      label: string;
      href: string;
      icon: string;
      copyValue?: never;
    }
  | {
      label: string;
      href: null;
      icon: string;
      copyValue: string;
    };

function mapLinks(query: string, location: string): MapAction[] {
  const encodedQuery = encodeURIComponent(query);

  return [
    {
      label: "Google Maps",
      href: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
      icon: "bi-google",
    },
    {
      label: "Maps",
      href: `https://maps.apple.com/?q=${encodedQuery}`,
      icon: "bi-map",
    },
    {
      label: "Waze",
      href: `https://waze.com/ul?q=${encodedQuery}&navigate=yes`,
      icon: "bi-sign-turn-right",
    },
    {
      label: "Αντιγραφή διεύθυνσης",
      href: null,
      icon: "bi-copy",
      copyValue: location,
    },
  ];
}

function WcDeliveryInfoSection({ row }: { row: wcCalendar }) {
  const [showMapChooser, setShowMapChooser] = React.useState(false);

  const delivery = getDeliveryInfo(row);
  if (!delivery) return null;

  const links = mapLinks(delivery.query, delivery.location);

  async function handleCopy(value: string) {
    await navigator.clipboard.writeText(value);
    setShowMapChooser(false);
  }

  return (
    <>
      <section
        className="mt-2 w-100"
        style={{
          background: "rgba(var(--bs-primary-rgb), .025)",
          border: "1px solid rgba(var(--bs-primary-rgb), .08)",
          borderRadius: 12,
          padding: "8px 9px",
        }}
        aria-label="Πληροφορίες παράδοσης"
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{
              width: 26,
              height: 26,
              background: "rgba(var(--bs-primary-rgb), .075)",
              color: "var(--bs-primary)",
            }}
          >
            <i className="bi bi-geo-alt-fill small" aria-hidden />
          </div>

          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="small text-secondary lh-sm">Παράδοση</div>

            <div
              className="small fw-semibold lh-sm mt-1"
              style={{
                color: "var(--bs-body-color)",
                wordBreak: "break-word",
              }}
            >
              {delivery.location}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-primary d-inline-flex align-items-center flex-shrink-0 gap-1"
            style={{
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: "nowrap",
              background: "rgba(var(--bs-primary-rgb), .88)",
              borderColor: "rgba(var(--bs-primary-rgb), .18)",
            }}
            aria-label="Άνοιγμα επιλογών χάρτη"
            onClick={() => setShowMapChooser(true)}
          >
            <i className="bi bi-box-arrow-up-right" aria-hidden />
            Χάρτης
          </button>
        </div>
      </section>

      <Modal
        show={showMapChooser}
        onHide={() => setShowMapChooser(false)}
        centered
        contentClassName="border-0 bg-transparent shadow-none"
      >
        <Modal.Body className="p-0">
          <div
            style={{
              position: "relative",
              borderRadius: 24,
              padding: 12,
              background: "rgba(var(--bs-body-bg-rgb))",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              boxShadow: "0 18px 50px rgba(0,0,0,.12)",
            }}
          >
            <div className="fw-semibold mb-2 text-center">
              Άνοιγμα χάρτη με:
            </div>

            <div className="d-flex flex-column gap-2">
              {links.map((link) => {
                if (link.href !== null) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="d-flex align-items-center justify-content-center text-decoration-none gap-2"
                      style={{
                        minHeight: 48,
                        borderRadius: 999,
                        background: "rgba(var(--bs-secondary-rgb), .10)",
                        color: "var(--bs-body-color)",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                      onClick={() => setShowMapChooser(false)}
                    >
                      <i className={`bi ${link.icon}`} aria-hidden />
                      {link.label}
                    </a>
                  );
                }

                return (
                  <button
                    key={link.label}
                    type="button"
                    className="d-flex align-items-center justify-content-center gap-2 border-0"
                    style={{
                      minHeight: 48,
                      borderRadius: 999,
                      background: "rgba(var(--bs-secondary-rgb), .10)",
                      color: "var(--bs-body-color)",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                    onClick={() => handleCopy(link.copyValue)}
                  >
                    <i className={`bi ${link.icon}`} aria-hidden />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

function WcCustomerContactSection({
  row,
  fetchEnabled,
}: {
  row: wcCalendar;
  fetchEnabled: boolean;
}) {
  const amka = (row.amka ?? "").trim();
  const gid = wcCustomerGid(row);
  const [loading, setLoading] = React.useState(() => !!(amka && fetchEnabled));
  const [data, setData] = React.useState<SearchCustomerTelsData | null>(null);

  React.useEffect(() => {
    if (!amka || !fetchEnabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    void fetchCustomerTelsCached(gid, amka)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [amka, gid, fetchEnabled]);

  if (!amka) return null;

  if (!fetchEnabled) return null;

  if (loading) {
    return (
      <div className="text-secondary small d-flex align-items-center mt-2 gap-1">
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden
          style={{ width: "0.85rem", height: "0.85rem" }}
        />
        Φόρτωση επαφών…
      </div>
    );
  }

  const phones = data?.telephones ?? [];
  const emails = data?.emails ?? [];
  if (!phones.length && !emails.length) {
    return null;
  }

  return (
    <div className="mt-2">
      {phones.length ? (
        <div className="d-flex flex-column gap-1">
          {phones.map((t, i) => {
            const href = telHref(t.phone);
            const label = (t.name ?? "").trim();
            const numberBlock = (
              <>
                <i
                  className="bi bi-telephone-fill me-1 flex-shrink-0"
                  aria-hidden
                />
                <span className="text-break">{t.phone}</span>
              </>
            );
            return (
              <div
                key={`${t.phone}-${i}`}
                className="small d-flex align-items-center flex-wrap"
              >
                {href ? (
                  <a
                    href={href}
                    className="d-inline-flex align-items-start text-decoration-none"
                    style={{ color: "var(--bs-primary)" }}
                  >
                    {numberBlock}
                  </a>
                ) : (
                  <span
                    className="d-inline-flex align-items-start"
                    style={{ color: "var(--bs-body-color)" }}
                  >
                    {numberBlock}
                  </span>
                )}
                {label ? (
                  <span className="text-secondary small ms-1">({label})</span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {emails.length ? (
        <div
          className={`d-flex flex-column gap-1 ${phones.length ? "mt-2" : ""}`}
        >
          {emails.map((email) => (
            <a
              key={email}
              href={email.trim() ? `mailto:${email.trim()}` : undefined}
              className="small d-inline-flex align-items-center text-decoration-none text-break gap-1"
              style={{ color: "var(--bs-primary)" }}
            >
              <i className="bi bi-envelope flex-shrink-0" aria-hidden />
              {email}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WcCalendarRow({
  row,
  showDivider,
  showTurnover,
  contactFetchEnabled,
}: {
  row: wcCalendar;
  showDivider: boolean;
  showTurnover: boolean;
  contactFetchEnabled: boolean;
}) {
  const last = formatUIDate(row.lastPAEO);
  const next = formatUIDate(row.lastOrderDate);
  const nextPart = next ? ` (${next})` : "";

  const summary = (
    <div style={{ minWidth: 0, flex: "1 1 auto" }}>
      <div
        className="fw-semibold"
        style={{ color: "var(--bs-body-color)", fontSize: 15 }}
      >
        {(row.customerName ?? "").trim() || "—"}
      </div>
      <div className="text-secondary small mt-1">
        {(row.doctoR_SINTAGHS ?? "").trim() || "—"}
      </div>
      <div className="small mt-1" style={{ color: "var(--bs-body-color)" }}>
        {last || "—"}
        <span className="text-secondary">{nextPart}</span>
      </div>
      <div className="text-secondary small mt-1">
        AMKA: {(row.amka ?? "").trim() || "—"}
      </div>
    </div>
  );

  return (
    <div
      className={showDivider ? "mb-3 pb-3" : "pb-1"}
      style={
        showDivider
          ? { borderBottom: "1px solid var(--bs-border-color-translucent)" }
          : undefined
      }
    >
      <div
        className={
          showTurnover
            ? "d-flex justify-content-between align-items-start gap-3"
            : ""
        }
      >
        {summary}
        {showTurnover ? (
          <div
            className="fw-semibold flex-shrink-0 text-end"
            style={{ fontSize: 15, color: "var(--bs-body-color)" }}
          >
            {formatCurrencyGR(row.totalTurnover)}€
          </div>
        ) : null}
      </div>

      <WcDeliveryInfoSection row={row} />
      <WcCustomerContactSection row={row} fetchEnabled={contactFetchEnabled} />
    </div>
  );
}

export default function WCDiadikasiaGroupedList({
  items,
  setAllOpenTo,
  onAllExpandedChange,
  groupOrder,
}: {
  items: wcCalendar[];
  setAllOpenTo?: boolean;
  onAllExpandedChange?: (expanded: boolean) => void;
  groupOrder?: WcCalendarGroupOrder;
}) {
  const months = React.useMemo(
    () => groupWcCalendarByLastOrderDate(items, groupOrder ?? {}),
    [items, groupOrder],
  );
  const monthKeys = React.useMemo(
    () => months.map((m) => String(m.sortKey)),
    [months],
  );
  const dayKeys = React.useMemo(
    () =>
      months.flatMap((m) => m.days.map((d) => `${m.sortKey}-${d.dayOfMonth}`)),
    [months],
  );
  const [openMonths, setOpenMonths] = React.useState<Record<string, boolean>>(
    {},
  );
  const [openDays, setOpenDays] = React.useState<Record<string, boolean>>({});

  const allExpanded =
    monthKeys.length > 0 &&
    dayKeys.length > 0 &&
    monthKeys.every((k) => !!openMonths[k]) &&
    dayKeys.every((k) => !!openDays[k]);

  const setAllTilesOpen = React.useCallback(
    (nextOpen: boolean) => {
      const nextMonths: Record<string, boolean> = {};
      const nextDays: Record<string, boolean> = {};
      for (const key of monthKeys) nextMonths[key] = nextOpen;
      for (const key of dayKeys) nextDays[key] = nextOpen;
      setOpenMonths(nextMonths);
      setOpenDays(nextDays);
    },
    [monthKeys, dayKeys],
  );

  React.useEffect(() => {
    if (typeof setAllOpenTo !== "boolean") return;
    setAllTilesOpen(setAllOpenTo);
  }, [setAllOpenTo, setAllTilesOpen]);

  React.useEffect(() => {
    onAllExpandedChange?.(allExpanded);
  }, [allExpanded, onAllExpandedChange]);

  if (!months.length) {
    return (
      <div className="app-card text-secondary p-3 text-center">
        Δεν υπάρχουν εγγραφές με αναμενόμενη ημερομηνία επόμενης παραγγελίας.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {months.map((m) => (
        <CollapsibleAppTile
          key={m.sortKey}
          open={!!openMonths[String(m.sortKey)]}
          onOpenChange={(open) =>
            setOpenMonths((prev) => ({
              ...prev,
              [String(m.sortKey)]: open,
            }))
          }
          summary={(expanded) => (
            <>
              <div style={{ minWidth: 0 }}>
                <div
                  className="fw-semibold"
                  style={{ color: "var(--bs-body-color)", fontSize: 16 }}
                >
                  {m.monthTitle}
                </div>
                <div className="text-secondary small mt-1">
                  {m.ordersCount} {m.ordersCount === 1 ? "εγγραφή" : "εγγραφές"}
                </div>
              </div>
              <div className="flex-shrink-0 text-end">
                <div
                  className="fw-semibold"
                  style={{ fontSize: 15, color: "var(--bs-body-color)" }}
                >
                  {formatCurrencyGR(m.totalTurnover)}€
                </div>
                <i
                  className="bi bi-chevron-down text-secondary d-inline-block mt-1"
                  style={{
                    fontSize: "1.1rem",
                    transition: "transform 160ms ease",
                    transform: expanded ? "rotate(-180deg)" : "none",
                  }}
                  aria-hidden
                />
              </div>
            </>
          )}
        >
          <div className="d-flex flex-column gap-2">
            {m.days.map((d) => (
              <CollapsibleAppTile
                key={`${m.sortKey}-${d.dayOfMonth}`}
                open={!!openDays[`${m.sortKey}-${d.dayOfMonth}`]}
                onOpenChange={(open) =>
                  setOpenDays((prev) => ({
                    ...prev,
                    [`${m.sortKey}-${d.dayOfMonth}`]: open,
                  }))
                }
                inset="compact"
                className="app-card-soft"
                summary={(expanded) => (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: 14, color: "var(--bs-body-color)" }}
                      >
                        {d.dayTitle}
                      </div>
                      <div className="text-secondary small mt-1">
                        {d.items.length}{" "}
                        {d.items.length === 1 ? "εγγραφή" : "εγγραφές"}
                      </div>
                    </div>
                    <div className="align-self-start flex-shrink-0 text-end">
                      <div
                        className="fw-semibold"
                        style={{ fontSize: 14, color: "var(--bs-body-color)" }}
                      >
                        {formatCurrencyGR(d.totalTurnover)}€
                      </div>
                      <i
                        className="bi bi-chevron-down text-secondary d-inline-block mt-1"
                        style={{
                          fontSize: "1rem",
                          transition: "transform 160ms ease",
                          transform: expanded ? "rotate(-180deg)" : "none",
                        }}
                        aria-hidden
                      />
                    </div>
                  </>
                )}
              >
                {d.items.map((r, idx) => {
                  const monthOpen = !!openMonths[String(m.sortKey)];
                  const dayKey = `${m.sortKey}-${d.dayOfMonth}`;
                  const dayOpen = !!openDays[dayKey];
                  const contactFetchEnabled = monthOpen && dayOpen;
                  return (
                    <WcCalendarRow
                      key={`${wcCalendarTaskCode(r)}-${r.customerCode}-${r.expectedNextOrderDate}-${idx}`}
                      row={r}
                      showDivider={idx < d.items.length - 1}
                      showTurnover={d.items.length > 1}
                      contactFetchEnabled={contactFetchEnabled}
                    />
                  );
                })}
              </CollapsibleAppTile>
            ))}
          </div>
        </CollapsibleAppTile>
      ))}
    </div>
  );
}
