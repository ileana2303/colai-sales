import type { ReportChatMessage } from "@/features/chat/types";

export type ReportChatMessagesProps = {
  messages: ReportChatMessage[];
  isStreaming: boolean;
};
