"use client";

import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
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

export function PowerBiTableHeaderFilter({
  label,
  onChange,
  options,
  value,
}: PowerBiTableHeaderFilterProps) {
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

  return (
    <Select
      items={items}
      value={currentValue}
      onValueChange={(next) =>
        onChange(!next || next === ALL_FILTER_VALUE ? "" : next)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={`${label}: ${selectedLabel}`}
        title={`${label}: ${selectedLabel}`}
        className="h-auto min-h-8 w-full max-w-[11rem] min-w-[6.5rem] gap-2 rounded-md border-border/60 bg-muted/40 px-2 py-1 hover:bg-muted/70"
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="block truncate text-xs font-medium text-foreground">
            {selectedLabel}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="max-h-72 w-max min-w-[12rem] max-w-[min(28rem,calc(100vw-2rem))]"
      >
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          <SelectItem value={ALL_FILTER_VALUE}>Όλα</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
