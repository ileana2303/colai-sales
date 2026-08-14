import type { ChatConversation } from "@/lib/chat/types";
import type { ReportChatMessage } from "@/features/chat/types";

export type UseReportChatResult = {
  messages: ReportChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  conversationId: string | null;
  conversations: ChatConversation[];
  isLoadingConversations: boolean;
  sendMessage: (rawText?: string) => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
};
