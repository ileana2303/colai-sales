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
} from "@/features/powerBI/PowerBiTable/types";

type PowerBiTableHeaderFilterProps = {
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
    <DropdownMenu modal={false} open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        aria-label={`${label}: ${selectedLabel}`}
        title={`${label}: ${selectedLabel}`}
        className={cn(
          "flex h-auto min-h-8 w-full max-w-44 min-w-26 items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-left hover:bg-muted/70",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="block truncate text-xs font-medium text-foreground">
            {selectedLabel}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-max min-w-48 max-w-[min(28rem,calc(100vw-2rem))] p-0"
      >
        <div className="sticky top-0 z-10 border-b border-border/60 bg-popover p-1.5">
          <div className="px-0.5 pb-1 text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <Input
            ref={searchInputRef}
            aria-label={`Αναζήτηση ${label}`}
            autoComplete="off"
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                    "cursor-pointer whitespace-normal wrap-break-word",
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
            <div className="px-2 py-2 text-xs text-muted-foreground">
              Δεν βρέθηκαν τιμές
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
