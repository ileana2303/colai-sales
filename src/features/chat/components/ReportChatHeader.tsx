"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { ReportChatConversationList } from "@/features/chat/components/ReportChatConversationList";
import type { ReportChatHeaderProps } from "@/features/chat/components/ReportChatHeader.types";

export function ReportChatHeader({
  brandLabel,
  viewLabel,
  conversations,
  activeConversationId,
  isLoadingConversations,
  isStreaming,
  canStartNew,
  onNewConversation,
  onSelectConversation,
  onDeleteRequest,
  onClose,
}: ReportChatHeaderProps) {
  return (
    <header className="report-chat-panel__header">
      <div className="report-chat-panel__title-wrap">
        <AppIcon name="bi-stars" size={16} className="text-primary" />
        <div className="min-w-0">
          <h2 className="report-chat-panel__title">Sales assistant</h2>
          <p className="report-chat-panel__subtitle truncate">
            {brandLabel}
            {viewLabel ? ` · ${viewLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="report-chat-panel__header-actions">
        <ReportChatConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoadingConversations}
          disabled={isStreaming}
          onSelect={onSelectConversation}
          onDeleteRequest={onDeleteRequest}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="New conversation"
          title="New conversation"
          onClick={onNewConversation}
          disabled={isStreaming || !canStartNew}
        >
          <AppIcon name="bi-plus" size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close chat"
          onClick={onClose}
        >
          <AppIcon name="bi-x" size={16} />
        </Button>
      </div>
    </header>
  );
}
