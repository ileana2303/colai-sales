"use client";

import React from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { SearchBar } from "@/components/ui/SearchBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppLoader from "@/components/ui/AppLoader";
import WCDiadikasiaGroupedList from "@/features/wcDiadikasia/components/WCDiadikasiaGroupedList";
import { fetchWCCalendar } from "@/store/wcDiadikasia/wcDiadikasiaSlice";
import { Alert, Button, FormSelect, Modal } from "react-bootstrap";
import { parseOrderDate } from "@/features/wcDiadikasia/groupWcCalendarByLastOrderDate";

const SEARCH_DEBOUNCE_MS = 400;

export default function DiadikasiaWC() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const wcDiadikasia = useAppSelector((s) => s.wcDiadiaksia);
  const listLoading = useAppSelector((s) => s.wcDiadiaksia.loadingList);
  const error = useAppSelector((s) => s.wcDiadiaksia.error);

  const [showFilters, setShowFilters] = React.useState(false);
  const [setAllTilesOpenTo, setSetAllTilesOpenTo] = React.useState(false);
  const [allTilesExpanded, setAllTilesExpanded] = React.useState(false);

  const urlSearch = (
    searchParams.get("searchfield") ??
    searchParams.get("search") ??
    ""
  ).trim();
  const onlyNext10Days = searchParams.get("next10") === "1";
  const monthOrder = searchParams.get("monthOrder") === "asc" ? "asc" : "desc";
  const [q, setQ] = React.useState(urlSearch);
  const debounceTimerRef = React.useRef<number | null>(null);

  const clearDebounceTimer = React.useCallback(() => {
    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const applySearchToUrl = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();

      params.delete("searchfield");
      params.delete("search");
      if (trimmed) params.set("searchfield", trimmed);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const applyNext10FilterToUrl = React.useCallback(
    (enabled: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (enabled) params.set("next10", "1");
      else params.delete("next10");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleMonthSort = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (monthOrder === "desc") params.set("monthOrder", "asc");
    else params.delete("monthOrder");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, monthOrder]);

  const wcGroupOrder = React.useMemo(
    () =>
      ({
        monthOrder: monthOrder === "asc" ? "asc" : "desc",
        dayOrder: "desc",
      }) as const,
    [monthOrder],
  );

  React.useEffect(() => {
    setQ(urlSearch);
  }, [urlSearch]);

  React.useEffect(() => {
    void dispatch(fetchWCCalendar(urlSearch ? { q: urlSearch } : undefined));
  }, [dispatch, urlSearch]);

  /** Sync typed input to URL after idle — no Enter required (better on mobile). */
  React.useEffect(() => {
    const trimmedQ = q.trim();
    const trimmedUrl = urlSearch.trim();
    if (trimmedQ === trimmedUrl) return;

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      applySearchToUrl(q);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearDebounceTimer();
    };
  }, [q, urlSearch, applySearchToUrl, clearDebounceTimer]);

  const applyFilters = () => {
    setShowFilters(false);
  };

  const onSubmitSearch = React.useCallback(() => {
    clearDebounceTimer();
    applySearchToUrl(q);
  }, [applySearchToUrl, clearDebounceTimer, q]);

  const onClearSearch = React.useCallback(() => {
    clearDebounceTimer();
    applySearchToUrl("");
  }, [applySearchToUrl, clearDebounceTimer]);

  const visibleItems = React.useMemo(() => {
    if (!onlyNext10Days) return wcDiadikasia.calendar;

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const maxDate = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      todayStart.getDate() + 10,
    );

    return wcDiadikasia.calendar.filter((item) => {
      const d = parseOrderDate(item.expectedNextOrderDate);
      if (!d) return false;
      const localDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return localDay >= todayStart && localDay <= maxDate;
    });
  }, [onlyNext10Days, wcDiadikasia.calendar]);

  const showInitialLoader = listLoading && wcDiadikasia.calendar.length === 0;

  return (
    <>
      <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
        <div className="app-card flex-grow-1">
          <SearchBar
            placeholder="Αναζήτηση"
            value={q}
            onChange={setQ}
            onSubmit={onSubmitSearch}
            onClear={onClearSearch}
          />
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => setSetAllTilesOpenTo((prev) => !prev)}
        >
          <i
            className={`bi ${allTilesExpanded ? "bi-arrows-collapse" : "bi-arrows-expand"}`}
            aria-hidden
          />
          <span className="visually-hidden">
            {allTilesExpanded ? "Σύμπτυξη όλων" : "Ανάπτυξη όλων"}
          </span>
        </button>
        <button
          type="button"
          className={`btn btn-sm flex-shrink-0 ${onlyNext10Days ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => applyNext10FilterToUrl(!onlyNext10Days)}
        >
          {onlyNext10Days ? "Προβολή όλων" : "Επόμενες 10 ημέρες"}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center flex-shrink-0 gap-1"
          onClick={toggleMonthSort}
          title="Πατήστε για εναλλαγή σειράς μηνών"
          aria-pressed={monthOrder === "asc"}
          aria-label={
            monthOrder === "desc"
              ? "Ταξινόμηση μήνα φθίνουσα. Εναλλαγή σε αύξουσα."
              : "Ταξινόμηση μήνα αύξουσα. Εναλλαγή σε φθίνουσα."
          }
        >
          <i
            className={`bi ${monthOrder === "desc" ? "bi-sort-down" : "bi-sort-up"}`}
            aria-hidden
          />
          <span className="text-nowrap">Μήνας</span>
        </button>
      </div>

      <div>
        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : showInitialLoader ? (
          <AppLoader label="Φόρτωση WC διαδικασίας…" />
        ) : visibleItems.length ? (
          <WCDiadikasiaGroupedList
            items={visibleItems}
            setAllOpenTo={setAllTilesOpenTo}
            onAllExpandedChange={setAllTilesExpanded}
            groupOrder={wcGroupOrder}
          />
        ) : (
          <div className="app-card text-secondary p-3 text-center">
            {onlyNext10Days
              ? "Δεν βρέθηκαν WC διαδικασίες για τις επόμενες 10 ημέρες."
              : "Δεν βρέθηκαν WC διαδικασίες"}
          </div>
        )}
      </div>

      <Modal show={showFilters} onHide={() => setShowFilters(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Φίλτρα WC</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label className="form-label small text-secondary mb-2">
            Area-Team
          </label>
          <FormSelect aria-label="Area-Team">
            {/* <option value="4">WC</option> */}
          </FormSelect>
          <label className="form-label small text-secondary mb-2">
            Πωλητής
          </label>
          <FormSelect aria-label="Πωλητής">
            {/* <option value="4">WC</option> */}
          </FormSelect>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={applyFilters}>
            Εφαρμογή
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
