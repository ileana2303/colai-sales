import type { ChatConversation } from "@/lib/chat/types";

export type ReportChatDeleteDialogProps = {
  conversation: ChatConversation | null;
  open: boolean;
  isDeleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};
