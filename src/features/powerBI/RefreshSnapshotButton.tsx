"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { refreshReportSnapshot } from "@/lib/api/snapshots";
import { cn } from "@/lib/utils";

type RefreshSnapshotButtonProps = {
  area?: string;
  brandLabel: string;
  pageCode: string;
  currentYear: number;
  compareYear: number;
  className?: string;
};

export function RefreshSnapshotButton({
  area,
  brandLabel,
  pageCode,
  currentYear,
  compareYear,
  className,
}: RefreshSnapshotButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      refreshReportSnapshot({
        area,
        pageCode,
        currentYear,
        compareYear,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: powerBiKeys.reportSnapshot(
          area ?? "",
          pageCode,
          currentYear,
          compareYear,
        ),
      });
      toast.success(`${brandLabel} snapshot uploaded`, {
        description: `${result.rowCount.toLocaleString("el-GR")} rows · ${result.snapshotDate}`,
      });
    },
    onError: (error) => {
      toast.error(`${brandLabel} snapshot failed`, {
        description:
          error instanceof Error
            ? error.message
            : "Failed to refresh snapshot.",
      });
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("gap-1.5", className)}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <AppIcon
        name="bi-arrow-repeat"
        size={14}
        className={cn(mutation.isPending && "animate-spin")}
      />
      {mutation.isPending ? "Uploading…" : "Re-upload snapshot"}
    </Button>
  );
}
