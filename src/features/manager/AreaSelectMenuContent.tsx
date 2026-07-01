"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { filterAreasBySearch } from "@/features/manager/areaSelectSearch";

type AreaSelectMenuContentProps = {
  areas: string[];
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  isOpen: boolean;
  onRetry?: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelect: (area: string) => void;
  pendingArea?: string | null;
  searchQuery: string;
  selectedArea: string;
};

export function AreaSelectMenuContent({
  areas,
  error,
  isError = false,
  isLoading = false,
  isOpen,
  onRetry,
  onSearchQueryChange,
  onSelect,
  pendingArea = null,
  searchQuery,
  selectedArea,
}: AreaSelectMenuContentProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filteredAreas = useMemo(
    () => filterAreasBySearch(areas, searchQuery),
    [areas, searchQuery],
  );
  const areasCountLabel =
    String(areas.length) +
    " " +
    (areas.length === 1 ? "διαθέσιμη διεύθυνση" : "διαθέσιμες διευθύνσεις");

  useLayoutEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-2 font-normal">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Επιλογή area</span>
            <span className="text-muted-foreground text-xs">
              {areas.length
                ? areasCountLabel
                : "Δεν βρέθηκαν διαθέσιμες διευθύνσεις."}
            </span>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <div className="border-border/60 bg-popover sticky top-0 z-10 border-b p-2">
        <input
          ref={searchInputRef}
          aria-label="Αναζήτηση area"
          autoComplete="off"
          className="area-select-search-input"
          placeholder="Αναζήτηση area…"
          type="search"
          value={searchQuery}
          disabled={isLoading || isError || !areas.length}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onMouseDownCapture={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerDownCapture={(event) => event.stopPropagation()}
        />
      </div>

      {isLoading ? (
        <DropdownMenuItem
          className="gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
          disabled
        >
          Φόρτωση διευθύνσεων…
        </DropdownMenuItem>
      ) : isError ? (
        <>
          <DropdownMenuLabel className="text-destructive px-2 py-2 text-xs">
            {error instanceof Error
              ? error.message
              : "Αποτυχία φόρτωσης διευθύνσεων."}
          </DropdownMenuLabel>
          {onRetry ? (
            <DropdownMenuItem
              className="hover:bg-muted/80 cursor-pointer gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
              onClick={() => void onRetry()}
            >
              <AppIcon name="bi-arrow-clockwise" size={16} />
              Δοκιμή ξανά
            </DropdownMenuItem>
          ) : null}
        </>
      ) : areas.length ? (
        filteredAreas.length ? (
          <DropdownMenuRadioGroup
            value={pendingArea ?? selectedArea}
            onValueChange={(area) => onSelect(String(area))}
          >
            {filteredAreas.map((area) => (
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
            Δεν βρέθηκαν διευθύνσεις με τα τρέχοντα φίλτρα.
          </DropdownMenuItem>
        )
      ) : (
        <DropdownMenuItem
          className="gap-2.5 px-3 py-2.5 text-[0.9375rem] font-medium"
          disabled
        >
          Δεν βρέθηκαν διαθέσιμες διευθύνσεις.
        </DropdownMenuItem>
      )}
    </>
  );
}
