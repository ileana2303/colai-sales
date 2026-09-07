"use client";

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

type ReportMatrixPdfExportDialogProps = {
  isExporting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  teamLabel: string;
};

export function ReportMatrixPdfExportDialog({
  isExporting,
  onConfirm,
  onOpenChange,
  open,
  teamLabel,
}: ReportMatrixPdfExportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Εξαγωγή PDF για όλους τους πωλητές;
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              Δεν έχει επιλεγεί πωλητής, οπότε θα ληφθούν ξεχωριστά αρχεία PDF.
            </span>
            <span className="block">
              {teamLabel === "Όλα"
                ? "Θα συμπεριληφθούν μέλη από όλα τα teams."
                : `Θα συμπεριληφθούν μόνο μέλη της ομάδας ${teamLabel}.`}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExporting}>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction disabled={isExporting} onClick={onConfirm}>
            {isExporting ? "Εξαγωγή…" : "Εξαγωγή PDF"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
