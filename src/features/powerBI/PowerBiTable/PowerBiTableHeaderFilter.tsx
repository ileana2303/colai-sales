"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Check } from "@/icons/lucide/check";
import { ChevronDown } from "@/icons/lucide/chevron-down";
import { cn } from "@/lib/utils";
import {
  ALL_FILTER_VALUE,
  type FilterOption,
} from "@/features/powerBI/types/PowerBiTable.types";

type PowerBiTableHeaderFilterProps = {
  fitContent?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("el-GR");
}

function matchesSearch(label: string, query: string) {
  if (!query) return true;
  return normalizeSearch(label).includes(normalizeSearch(query));
}

export function PowerBiTableHeaderFilter({
  fitContent = false,
  label,
  onChange,
  options,
  value,
}: PowerBiTableHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Όλα";
  const currentValue = value || ALL_FILTER_VALUE;

  const items = useMemo(
    () => [
      { value: ALL_FILTER_VALUE, label: "Όλα" },
      ...options.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [options],
  );

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearch(item.label, searchQuery)),
    [items, searchQuery],
  );

  useLayoutEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  }

  function selectValue(next: string) {
    onChange(!next || next === ALL_FILTER_VALUE ? "" : next);
    setOpen(false);
    setSearchQuery("");
  }

  return (
    <div
      className={cn(
        "power-bi-table-header-filter",
        fitContent && "w-fit max-w-full",
      )}
    >
      <DropdownMenu modal={false} open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          aria-label={`${label}: ${selectedLabel}`}
          title={`${label}: ${selectedLabel}`}
          className={cn(
            "power-bi-table-header-filter__trigger border-border bg-background hover:border-border hover:bg-muted/35 flex h-auto min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left shadow-sm transition-colors",
            fitContent ? "w-auto max-w-full" : "w-full max-w-56 min-w-36",
          )}
        >
          <span className={cn(fitContent ? "" : "min-w-0 flex-1")}>
            <span
              className={cn(
                "text-foreground/65 block text-xs font-bold tracking-wider uppercase",
                !fitContent && "truncate",
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                "text-foreground block text-base leading-tight font-semibold",
                fitContent ? "whitespace-nowrap" : "truncate",
              )}
            >
              {selectedLabel}
            </span>
          </span>
          <ChevronDown className="text-foreground/60 size-5 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="w-max max-w-[min(28rem,calc(100vw-2rem))] min-w-48 p-0"
        >
          <div className="border-border/60 bg-popover sticky top-0 z-10 border-b p-1.5">
            <div className="text-muted-foreground px-0.5 pb-1 text-xs font-medium">
              {label}
            </div>
            <Input
              ref={searchInputRef}
              aria-label={`Αναζήτηση ${label}`}
              autoComplete="off"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3"
              placeholder="Αναζήτηση..."
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseDownCapture={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerDownCapture={(event) => event.stopPropagation()}
            />
          </div>
          <DropdownMenuGroup className="max-h-72 overflow-y-auto p-1">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const isSelected = currentValue === item.value;

                return (
                  <DropdownMenuItem
                    key={item.value}
                    className={cn(
                      "cursor-pointer wrap-break-word whitespace-normal",
                      isSelected && "bg-accent/60",
                    )}
                    onClick={() => selectValue(item.value)}
                  >
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {isSelected ? (
                      <Check className="ml-2 size-4 shrink-0" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="text-muted-foreground px-2 py-2 text-xs">
                Δεν βρέθηκαν τιμές
              </div>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
