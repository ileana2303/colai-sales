"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { fetchPowerBiSellers } from "@/lib/api/powerbi";
import { getUniquePowerBiAreas } from "@/lib/bi-reports/sellers";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";
import { ChevronDown } from "@/icons/lucide/chevron-down";

const HIDDEN_PATHS = new Set(["/select-seller"]);

export function SelectedSellerBar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userInfos = useAuthStore((state) => state.userInfos);
  const hydrated = useSelectedSellerStore((state) => state.hydrated);
  const selectedSeller = useSelectedSellerStore(
    (state) => state.selectedSeller,
  );
  const selectArea = useSelectedSellerStore((state) => state.selectArea);
  const [pendingArea, setPendingArea] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const isVisible =
    isAreaPickerUser(userInfos) &&
    hydrated &&
    Boolean(selectedSeller) &&
    !HIDDEN_PATHS.has(pathname);

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: [...powerBiKeys.all, "sellers", "all"],
    queryFn: () => fetchPowerBiSellers("all"),
    staleTime: 60_000,
    retry: 1,
    enabled: isVisible,
  });

  const availableAreas = useMemo(
    () => getUniquePowerBiAreas(data?.records ?? []),
    [data?.records],
  );

  if (!isVisible || !selectedSeller) {
    return null;
  }

  const selectedArea = selectedSeller.area.trim();
  const metaLabel = pendingArea
    ? "Αλλαγή περιοχής…"
    : "Προβολή αναφορών για περιοχή";
  const areasCountLabel =
    String(availableAreas.length) +
    " " +
    (availableAreas.length === 1 ? "διαθέσιμη περιοχή" : "διαθέσιμες περιοχές");

  async function handleAreaSelect(area: string) {
    const nextArea = area.trim();
    if (!nextArea || nextArea === selectedArea || pendingArea) return;

    setSelectionError(null);
    setPendingArea(nextArea);

    try {
      await selectArea(nextArea);
      await queryClient.invalidateQueries({ queryKey: powerBiKeys.all });
      router.refresh();
    } catch (selection) {
      setSelectionError(
        selection instanceof Error
          ? selection.message
          : "Αποτυχία επιλογής περιοχής.",
      );
    } finally {
      setPendingArea(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="app-header-user app-header-user--scope"
        aria-label="Επιλογή περιοχής αναφορών"
        disabled={Boolean(pendingArea)}
      >
        <span
          className="app-header-user__avatar app-header-user__avatar--scope"
          aria-hidden
        >
          <AppIcon name="bi-hospital" size={18} />
        </span>
        <span className="app-header-user__text">
          <span className="app-header-user__name" title={selectedArea}>
            {pendingArea ?? selectedArea}
          </span>
          <span className="app-header-user__meta">{metaLabel}</span>
        </span>
        <ChevronDown className="app-header-user__chevron" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Επιλογή περιοχής</span>
              <span className="text-muted-foreground text-xs">
                {availableAreas.length
                  ? areasCountLabel
                  : "Δεν βρέθηκαν διαθέσιμες περιοχές."}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {isLoading ? (
          <DropdownMenuItem
            className="gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
            disabled
          >
            Φόρτωση περιοχών…
          </DropdownMenuItem>
        ) : isError ? (
          <>
            <DropdownMenuLabel className="text-destructive px-2 py-2 text-xs">
              {error instanceof Error
                ? error.message
                : "Αποτυχία φόρτωσης περιοχών."}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="hover:bg-muted/80 cursor-pointer gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
              onClick={() => void refetch()}
            >
              <AppIcon name="bi-arrow-clockwise" size={16} />
              Δοκιμή ξανά
            </DropdownMenuItem>
          </>
        ) : availableAreas.length ? (
          <DropdownMenuRadioGroup
            value={pendingArea ?? selectedArea}
            onValueChange={(area) => void handleAreaSelect(String(area))}
          >
            {availableAreas.map((area) => (
              <DropdownMenuRadioItem
                key={area}
                value={area}
                disabled={Boolean(pendingArea)}
                className="cursor-pointer gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
              >
                {area}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem
            className="gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
            disabled
          >
            Δεν βρέθηκαν διαθέσιμες περιοχές.
          </DropdownMenuItem>
        )}

        {selectionError ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-destructive px-2 py-2 text-xs">
              {selectionError}
            </DropdownMenuLabel>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
