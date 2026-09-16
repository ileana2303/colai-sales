"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatMonthRange,
  getShortMonthLabel,
  GREEK_SHORT_MONTH_LABELS,
} from "@/features/powerBI/reportMatrixClosedPeriod";
import type {
  ReportMatrixClosedPeriodRange,
  ReportMatrixClosedPeriodSelection,
  ReportMatrixPeriodSummaryItem,
} from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import { ChevronDown } from "@/icons/lucide/chevron-down";
import { cn } from "@/lib/utils";

export type ReportMatrixPeriodSummaryPanelProps = {
  closedPeriodSelection?: ReportMatrixClosedPeriodSelection;
  items: ReportMatrixPeriodSummaryItem[];
};

function MonthGrid({
  lastClosedMonthIndex,
  maxMonthIndex,
  minMonthIndex,
  selectedMonthIndex,
  onSelect,
}: {
  lastClosedMonthIndex: number;
  maxMonthIndex: number;
  minMonthIndex: number;
  selectedMonthIndex: number;
  onSelect: (monthIndex: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {GREEK_SHORT_MONTH_LABELS.map((label, monthIndex) => {
        const disabled =
          monthIndex > lastClosedMonthIndex ||
          monthIndex < minMonthIndex ||
          monthIndex > maxMonthIndex;
        const isSelected = monthIndex === selectedMonthIndex;

        return (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "h-8 px-2 text-xs",
              isSelected &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => onSelect(monthIndex)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function MonthPickerField({
  label,
  lastClosedMonthIndex,
  maxMonthIndex,
  minMonthIndex,
  value,
  onChange,
}: {
  label: string;
  lastClosedMonthIndex: number;
  maxMonthIndex: number;
  minMonthIndex: number;
  value: number;
  onChange: (monthIndex: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={`${label}: ${getShortMonthLabel(value)}`}
          className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-2.5 text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        >
          <span>{getShortMonthLabel(value)}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
          <PopoverHeader className="px-3 pt-3">
            <PopoverTitle>{label}</PopoverTitle>
            <PopoverDescription>Επιλέξτε μήνα.</PopoverDescription>
          </PopoverHeader>
          <MonthGrid
            lastClosedMonthIndex={lastClosedMonthIndex}
            maxMonthIndex={maxMonthIndex}
            minMonthIndex={minMonthIndex}
            selectedMonthIndex={value}
            onSelect={(monthIndex) => {
              onChange(monthIndex);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ClosedPeriodItem({
  item,
  selection,
}: {
  item: ReportMatrixPeriodSummaryItem;
  selection?: ReportMatrixClosedPeriodSelection;
}) {
  const [open, setOpen] = useState(false);
  const displayValue = selection
    ? formatMonthRange(selection.startMonthIndex, selection.endMonthIndex)
    : item.value;
  const isInteractive = Boolean(selection && !selection.readOnly);

  const content = (
    <>
      <div className="snapshot-period-summary__heading">
        <span className="snapshot-period-summary__label">{item.label}</span>
        {item.hint ? (
          <span className="snapshot-period-summary__hint">{item.hint}</span>
        ) : null}
      </div>
      <strong className="snapshot-period-summary__value">{displayValue}</strong>
      {isInteractive ? (
        <span aria-hidden className="snapshot-period-summary__item-chevron">
          <ChevronDown />
        </span>
      ) : null}
    </>
  );

  if (!isInteractive || !selection) {
    return <div className="snapshot-period-summary__item">{content}</div>;
  }

  const { startMonthIndex, endMonthIndex, lastClosedMonthIndex } = selection;

  const applyRange = (next: ReportMatrixClosedPeriodRange) => {
    selection.onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${item.label}: ${displayValue}`}
        className="snapshot-period-summary__item snapshot-period-summary__item--interactive"
        title={`${item.label}: ${displayValue}`}
      >
        {content}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <PopoverHeader className="px-3 pt-3">
          <PopoverTitle>Κλειστή περίοδος</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-3 px-3 py-3">
          <MonthPickerField
            label="Από"
            lastClosedMonthIndex={lastClosedMonthIndex}
            minMonthIndex={0}
            maxMonthIndex={endMonthIndex}
            value={startMonthIndex}
            onChange={(nextStartMonthIndex) => {
              applyRange({
                startMonthIndex: nextStartMonthIndex,
                endMonthIndex: Math.max(nextStartMonthIndex, endMonthIndex),
              });
            }}
          />
          <MonthPickerField
            label="Έως"
            lastClosedMonthIndex={lastClosedMonthIndex}
            minMonthIndex={startMonthIndex}
            maxMonthIndex={lastClosedMonthIndex}
            value={endMonthIndex}
            onChange={(nextEndMonthIndex) => {
              applyRange({
                startMonthIndex: Math.min(startMonthIndex, nextEndMonthIndex),
                endMonthIndex: nextEndMonthIndex,
              });
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              applyRange({
                startMonthIndex: 0,
                endMonthIndex: lastClosedMonthIndex,
              });
              setOpen(false);
            }}
          >
            Από αρχή έτους
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReportMatrixPeriodSummaryPanel({
  closedPeriodSelection,
  items,
}: ReportMatrixPeriodSummaryPanelProps) {
  if (!items.length) return null;

  return (
    <div className="snapshot-period-summary" aria-label="Περίοδος στιγμιοτύπου">
      {items.map((item) =>
        item.key === "closed-period" ? (
          <ClosedPeriodItem
            key={item.key}
            item={item}
            selection={closedPeriodSelection}
          />
        ) : (
          <div key={item.key} className="snapshot-period-summary__item">
            <div className="snapshot-period-summary__heading">
              <span className="snapshot-period-summary__label">
                {item.label}
              </span>
              {item.hint ? (
                <span className="snapshot-period-summary__hint">
                  {item.hint}
                </span>
              ) : null}
            </div>
            <strong className="snapshot-period-summary__value">
              {item.value}
            </strong>
          </div>
        ),
      )}
    </div>
  );
}
