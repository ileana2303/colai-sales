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
import { X } from "@/icons/lucide/x";
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
  readOnly?: boolean;
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
  readOnly = false,
  value,
}: PowerBiTableHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel =
    selectedOption?.label ?? (readOnly && value.trim() ? value : "Όλα");
  const currentValue = value || ALL_FILTER_VALUE;
  const isActive = Boolean(value.trim());

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

  const isSelectedFilter = isActive && !readOnly;
  const triggerClassName = cn(
    "power-bi-table-header-filter__trigger border-input bg-background flex h-10 items-center justify-between gap-2 rounded-md border px-3.5 py-0 text-left text-sm font-medium whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    isSelectedFilter &&
      "border-[#D1FADE] bg-[#F1F5F9] dark:border-emerald-700/50 dark:bg-muted",
    isSelectedFilter && "pr-10",
    fitContent || isActive ? "w-auto max-w-full" : "w-full",
    readOnly
      ? "cursor-default"
      : "hover:border-border hover:bg-muted/35 transition-colors",
  );

  if (readOnly) {
    return (
      <div
        className={cn(
          "power-bi-table-header-filter",
          fitContent || isActive ? "w-fit max-w-full" : "w-56",
        )}
      >
        <div
          aria-label={`${label}: ${selectedLabel}`}
          title={`${label}: ${selectedLabel}`}
          className={triggerClassName}
        >
          <span
            className={cn(
              "flex items-center gap-1.5",
              fitContent ? "" : "min-w-0 flex-1",
            )}
          >
            <span
              className={cn(
                "text-foreground/65 shrink-0 text-sm font-medium",
                !fitContent && "truncate",
              )}
            >
              {label}:
            </span>
            <span
              className={cn(
                "text-foreground text-sm font-medium",
                fitContent || isActive ? "whitespace-nowrap" : "truncate",
              )}
            >
              {selectedLabel}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "power-bi-table-header-filter relative",
        fitContent || isActive ? "w-fit max-w-full" : "w-56",
      )}
    >
      <DropdownMenu modal={false} open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          aria-label={`${label}: ${selectedLabel}`}
          title={`${label}: ${selectedLabel}`}
          className={triggerClassName}
        >
          <span
            className={cn(
              "flex items-center gap-1.5",
              fitContent ? "" : "min-w-0 flex-1",
            )}
          >
            <span
              className={cn(
                "text-foreground/65 shrink-0 text-sm font-medium",
                !fitContent && "truncate",
              )}
            >
              {label}:
            </span>
            <span
              className={cn(
                "text-foreground text-sm font-medium",
                fitContent || isActive ? "whitespace-nowrap" : "truncate",
              )}
            >
              {selectedLabel}
            </span>
          </span>
          {!isActive ? (
            <ChevronDown className="text-foreground/60 size-5 shrink-0" />
          ) : null}
        </DropdownMenuTrigger>
        {isActive ? (
          <>
            <button
              type="button"
              aria-label={`Clear ${label} filter`}
              className="peer text-foreground/60 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm transition-colors outline-none focus-visible:ring-2"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <X className="size-3.5" />
            </button>
            <span
              role="tooltip"
              className="bg-foreground text-background pointer-events-none absolute top-full right-0 z-30 mt-2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100"
            >
              Clear {label} filter
            </span>
          </>
        ) : null}
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
