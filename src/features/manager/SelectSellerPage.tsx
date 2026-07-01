"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterAreasBySearch } from "@/features/manager/areaSelectSearch";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { fetchPowerBiSellers } from "@/lib/api/powerbi";
import { getUniquePowerBiAreas } from "@/lib/bi-reports/sellers";
import { cn } from "@/lib/utils";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

export function SelectSellerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedSeller = useSelectedSellerStore(
    (state) => state.selectedSeller,
  );
  const selectArea = useSelectedSellerStore((state) => state.selectArea);
  const [selectedArea, setSelectedArea] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: [...powerBiKeys.all, "sellers", "all"],
    queryFn: () => fetchPowerBiSellers("all"),
    staleTime: 60_000,
    retry: 1,
  });

  const availableAreas = useMemo(
    () => getUniquePowerBiAreas(data?.records ?? []),
    [data?.records],
  );

  const filteredAreas = useMemo(
    () => filterAreasBySearch(availableAreas, searchQuery),
    [availableAreas, searchQuery],
  );

  useEffect(() => {
    if (!selectedArea && selectedSeller?.area) {
      setSelectedArea(selectedSeller.area);
    }
  }, [selectedArea, selectedSeller?.area]);

  async function handleSelectArea() {
    const area = selectedArea.trim();
    if (!area || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await selectArea(area);
      await queryClient.invalidateQueries({ queryKey: powerBiKeys.all });
      router.replace("/");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCurrentSelection =
    Boolean(selectedSeller?.area) && selectedArea === selectedSeller?.area;

  return (
    <div className="area-picker-page">
      <section className="app-card area-picker-card p-4">
        <div className="area-picker-card__header">
          <h1 className="app-report-title mb-0">Επιλογή area πωλήσεων</h1>
          <p className="app-report-subtitle mb-0">
            Επιλέξτε διεύθυνση για προβολή των αντίστοιχων αναφορών
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Φόρτωση διευθύνσεων…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {error instanceof Error
                ? error.message
                : "Αποτυχία φόρτωσης διευθύνσεων"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              <AppIcon name="bi-arrow-clockwise" size={16} />
              Δοκιμή ξανά
            </Button>
          </div>
        ) : (
          <div className="area-picker-panel">
            <span className="area-picker-panel__label">
              <span className="area-picker-panel__label-icon" aria-hidden>
                <AppIcon name="bi-hospital" size={13} />
              </span>
              Διεύθυνση Πωλήσεων
            </span>

            <Input
              type="search"
              value={searchQuery}
              disabled={!availableAreas.length || isSubmitting}
              placeholder="Αναζήτηση διεύθυνσης…"
              aria-label="Αναζήτηση area"
              className="area-picker-search-input"
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            <div
              className="area-picker-options"
              role="listbox"
              aria-label="Διαθέσιμες διευθύνσεις"
            >
              {!availableAreas.length ? (
                <p className="area-picker-options__empty">
                  Δεν βρέθηκαν διαθέσιμες διευθύνσεις.
                </p>
              ) : !filteredAreas.length ? (
                <p className="area-picker-options__empty">
                  Δεν βρέθηκαν διευθύνσεις με τα τρέχοντα φίλτρα.
                </p>
              ) : (
                filteredAreas.map((area) => {
                  const isSelected = selectedArea === area;

                  return (
                    <button
                      key={area}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isSubmitting}
                      className={cn(
                        "area-picker-option",
                        isSelected && "area-picker-option--selected",
                      )}
                      onClick={() => setSelectedArea(area)}
                    >
                      {area}
                    </button>
                  );
                })
              )}
            </div>

            {availableAreas.length ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  disabled={!selectedArea || isSubmitting}
                  className="area-picker-panel__action"
                  onClick={() => void handleSelectArea()}
                >
                  {isSubmitting
                    ? "Επιλογή…"
                    : isCurrentSelection
                      ? "Επιλεγμένη"
                      : "Επιλογή area"}
                </Button>
                <p className="area-picker-panel__meta">
                  {filteredAreas.length} από {availableAreas.length} διαθέσιμες
                  διευθύνσεις
                </p>
              </>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
