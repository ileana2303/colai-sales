"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaSelectMenuContent } from "@/features/manager/AreaSelectMenuContent";
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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    ? "Αλλαγή διεύθυνσης…"
    : "Προβολή αναφορών για area";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      setSelectionError(null);
    }
  }

  async function handleAreaSelect(area: string) {
    const nextArea = area.trim();
    setOpen(false);
    setSearchQuery("");

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
          : "Αποτυχία επιλογής διεύθυνσης.",
      );
    } finally {
      setPendingArea(null);
    }
  }

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="app-header-user app-header-user--scope"
        aria-label="Επιλογή area αναφορών"
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
      <DropdownMenuContent align="end" className="w-80 p-0">
        <AreaSelectMenuContent
          areas={availableAreas}
          error={error}
          isError={isError}
          isLoading={isLoading}
          isOpen={open}
          pendingArea={pendingArea}
          searchQuery={searchQuery}
          selectedArea={selectedArea}
          onRetry={() => void refetch()}
          onSearchQueryChange={setSearchQuery}
          onSelect={(area) => void handleAreaSelect(area)}
        />
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
