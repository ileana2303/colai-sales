"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ReportMatrixPdfExportMode =
  | "all-sellers"
  | "all-teams"
  | "current-view";

type ReportMatrixPdfExportDialogProps = {
  isExporting: boolean;
  onConfirm: (mode: ReportMatrixPdfExportMode) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showTeamTotalsOption?: boolean;
  teamLabel: string;
};

export function ReportMatrixPdfExportDialog({
  isExporting,
  onConfirm,
  onOpenChange,
  open,
  showTeamTotalsOption = false,
  teamLabel,
}: ReportMatrixPdfExportDialogProps) {
  const [exportMode, setExportMode] =
    useState<ReportMatrixPdfExportMode>("current-view");

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setExportMode("current-view");
    }

    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Εξαγωγή PDF</AlertDialogTitle>
          <AlertDialogDescription>
            Επιλέξτε τι θέλετε να εξαγάγετε.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <Label
            className={cn(
              "cursor-pointer items-start rounded-lg border p-3 font-normal",
              exportMode === "current-view"
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            <input
              checked={exportMode === "current-view"}
              className="mt-0.5"
              disabled={isExporting}
              name="pdf-export-mode"
              type="radio"
              value="current-view"
              onChange={() => setExportMode("current-view")}
            />
            <span className="space-y-1">
              <span className="block font-medium text-foreground">
                Τρέχουσα προβολή
              </span>
              <span className="block text-sm leading-relaxed text-muted-foreground">
                Εξαγωγή όπως εμφανίζεται στην οθόνη.
              </span>
            </span>
          </Label>
          {showTeamTotalsOption ? (
            <Label
              className={cn(
                "cursor-pointer items-start rounded-lg border p-3 font-normal",
                exportMode === "all-teams"
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <input
                checked={exportMode === "all-teams"}
                className="mt-0.5"
                disabled={isExporting}
                name="pdf-export-mode"
                type="radio"
                value="all-teams"
                onChange={() => setExportMode("all-teams")}
              />
              <span className="space-y-1">
                <span className="block font-medium text-foreground">
                  Σύνολα ομάδων
                </span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  Θα ληφθούν ξεχωριστά αρχεία PDF με τα σύνολα κάθε ομάδας.
                </span>
              </span>
            </Label>
          ) : null}
          <Label
            className={cn(
              "cursor-pointer items-start rounded-lg border p-3 font-normal",
              exportMode === "all-sellers"
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            <input
              checked={exportMode === "all-sellers"}
              className="mt-0.5"
              disabled={isExporting}
              name="pdf-export-mode"
              type="radio"
              value="all-sellers"
              onChange={() => setExportMode("all-sellers")}
            />
            <span className="space-y-1">
              <span className="block font-medium text-foreground">
                Όλοι οι πωλητές
              </span>
              <span className="block text-sm leading-relaxed text-muted-foreground">
                Θα ληφθούν ξεχωριστά αρχεία PDF.{" "}
                {teamLabel === "Όλα"
                  ? "Θα συμπεριληφθούν μέλη από όλα τα teams."
                  : `Θα συμπεριληφθούν μόνο μέλη της ομάδας ${teamLabel}.`}
              </span>
            </span>
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExporting}>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction
            disabled={isExporting}
            onClick={() => onConfirm(exportMode)}
          >
            {isExporting ? "Εξαγωγή…" : "Εξαγωγή PDF"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
