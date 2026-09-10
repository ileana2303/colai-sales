"use client";

import { useMemo } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ReportMatrixClosedPeriodSelection,
  ReportMatrixPeriodSummaryItem,
} from "@/features/powerBI/types/reportMatrixPeriodSummary.types";
import { ChevronDown } from "@/icons/lucide/chevron-down";
import { cn } from "@/lib/utils";

export type ReportMatrixPeriodSummaryPanelProps = {
  closedPeriodSelection?: ReportMatrixClosedPeriodSelection;
  items: ReportMatrixPeriodSummaryItem[];
};

function ClosedPeriodItem({
  item,
  selection,
}: {
  item: ReportMatrixPeriodSummaryItem;
  selection?: ReportMatrixClosedPeriodSelection;
}) {
  const selectedOption = useMemo(
    () => selection?.options.find((option) => option.value === selection.value),
    [selection],
  );
  const displayValue = selectedOption?.label ?? item.value;
  const isInteractive = Boolean(
    selection && !selection.readOnly && selection.options.length > 1,
  );

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

  if (!isInteractive) {
    return (
      <div className="snapshot-period-summary__item">{content}</div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`${item.label}: ${displayValue}`}
        className="snapshot-period-summary__item snapshot-period-summary__item--interactive"
        title={`${item.label}: ${displayValue}`}
      >
        {content}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {selection!.options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              option.value === selection!.value && "bg-accent font-medium",
            )}
            onClick={() => selection!.onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
              <span className="snapshot-period-summary__label">{item.label}</span>
              {item.hint ? (
                <span className="snapshot-period-summary__hint">{item.hint}</span>
              ) : null}
            </div>
            <strong className="snapshot-period-summary__value">{item.value}</strong>
          </div>
        ),
      )}
    </div>
  );
}
