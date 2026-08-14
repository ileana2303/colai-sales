import type { ReportChatContext } from "@/features/chat/types";

export type ReportChatPanelProps = {
  context: ReportChatContext;
  onClose: () => void;
};
