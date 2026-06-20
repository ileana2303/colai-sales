"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";

type PowerBiTableToolbarProps = {
  hasActiveFilters: boolean;
  onExport: () => void;
  onResetFilters: () => void;
  subtitle: string;
  title: string;
  visibleRowCount: number;
};

export function PowerBiTableToolbar({
  hasActiveFilters,
  onExport,
  onResetFilters,
  subtitle,
  title,
  visibleRowCount,
}: PowerBiTableToolbarProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!visibleRowCount}
          onClick={onExport}
        >
          <AppIcon name="bi-file-earmark-excel" className="mr-1" size={14} />
          Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={onResetFilters}
        >
          <AppIcon name="bi-arrow-counterclockwise" className="mr-1" size={14} />
          Reset filters
        </Button>
      </div>
    </div>
  );
}
