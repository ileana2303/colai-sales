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
import type { ReportChatDeleteDialogProps } from "@/features/chat/components/ReportChatDeleteDialog.types";
import { formatConversationTitle } from "@/features/chat/lib/format";

export function ReportChatDeleteDialog({
  conversation,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: ReportChatDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Διαγραφή συνομιλίας;</AlertDialogTitle>
          <AlertDialogDescription>
            Η ενέργεια διαγράφει οριστικά
            {conversation
              ? ` τη συνομιλία «${formatConversationTitle(conversation)}»`
              : " αυτή τη συνομιλία"}{" "}
            και το ιστορικό της.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Διαγραφή…" : "Διαγραφή"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
