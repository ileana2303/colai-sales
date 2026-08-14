import type { ChatConversation } from "@/lib/chat/types";

export type ReportChatConversationListProps = {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  disabled?: boolean;
  onSelect: (conversationId: string) => void;
  onDeleteRequest: (conversation: ChatConversation) => void;
};
