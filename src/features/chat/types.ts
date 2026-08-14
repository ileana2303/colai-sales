import type { ChatConversation } from "@/lib/chat/types";
import type { ChatRole } from "@/lib/chat/types";

export type ReportChatContext = {
  brandLabel: string;
  reportKey: string;
  snapshotPageCode?: string;
  currentYear?: number;
  previousYear?: number;
  snapshotDate?: string;
  area?: string | null;
  viewLabel?: string;
};

export type ReportChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type { ChatConversation };
