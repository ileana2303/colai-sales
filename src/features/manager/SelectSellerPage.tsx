"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { fetchPowerBiSellers } from "@/lib/api/powerbi";
import { getUniquePowerBiAreas } from "@/lib/bi-reports/sellers";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

export function SelectSellerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedSeller = useSelectedSellerStore(
    (state) => state.selectedSeller,
  );
  const selectArea = useSelectedSellerStore((state) => state.selectArea);
  const [selectedArea, setSelectedArea] = useState("");
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
          <h1 className="app-report-title mb-0">Επιλογή διεύθυνσης πωλήσεων</h1>
          <p className="app-report-subtitle mb-0">
            Επιλέξτε διεύθυνση για προβολή των αντίστοιχων αναφορών
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Φόρτωση διευθύνσεων...
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

            <div className="area-picker-select-wrap">
              <select
                value={selectedArea}
                disabled={!availableAreas.length || isSubmitting}
                onChange={(event) => setSelectedArea(event.target.value)}
                className="area-picker-select"
                aria-label="Επιλογή διεύθυνσης πωλήσεων"
              >
                <option value="">Επιλέξτε…</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <AppIcon
                name="bi-chevron-down"
                size={16}
                className="area-picker-select-wrap__chevron"
              />
            </div>

            {!availableAreas.length ? (
              <p className="area-picker-panel__meta">
                Δεν βρέθηκαν διαθέσιμες διευθύνσεις.
              </p>
            ) : (
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
                      : "Επιλογή διεύθυνσης"}
                </Button>
                <p className="area-picker-panel__meta">
                  {availableAreas.length} διαθέσιμες διευθύνσεις
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
