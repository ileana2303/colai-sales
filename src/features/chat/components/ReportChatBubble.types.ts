import type { ChatRole } from "@/lib/chat/types";

export type ReportChatBubbleProps = {
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
};
