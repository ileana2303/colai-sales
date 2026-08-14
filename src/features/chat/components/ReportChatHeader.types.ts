import type { ChatConversation } from "@/lib/chat/types";

export type ReportChatHeaderProps = {
  brandLabel: string;
  viewLabel?: string;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  isStreaming: boolean;
  canStartNew: boolean;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteRequest: (conversation: ChatConversation) => void;
  onClose: () => void;
};
