"use client";

import { useRef, useState } from "react";

import { ReportChatComposer } from "@/features/chat/components/ReportChatComposer";
import { ReportChatDeleteDialog } from "@/features/chat/components/ReportChatDeleteDialog";
import { ReportChatHeader } from "@/features/chat/components/ReportChatHeader";
import { ReportChatMessages } from "@/features/chat/components/ReportChatMessages";
import type { ReportChatPanelProps } from "@/features/chat/components/ReportChatPanel.types";
import { useFillRemainingViewportHeight } from "@/features/chat/hooks/useFillRemainingViewportHeight";
import { useReportChat } from "@/features/chat/hooks/useReportChat";
import type { ChatConversation } from "@/lib/chat/types";

export function ReportChatPanel({ context, onClose }: ReportChatPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  useFillRemainingViewportHeight(panelRef, { bottomGap: 12 });

  const {
    messages,
    input,
    setInput,
    isStreaming,
    isLoadingMessages,
    error,
    conversationId,
    conversations,
    isLoadingConversations,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
  } = useReportChat(context);

  const [pendingDelete, setPendingDelete] = useState<ChatConversation | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const emptyHint = !context.area
    ? "Select an area before chatting about this report."
    : isLoadingMessages
      ? "Loading conversation…"
      : null;

  return (
    <aside
      ref={panelRef}
      className="report-chat-panel"
      aria-label="Report assistant chat"
    >
      <ReportChatHeader
        brandLabel={context.brandLabel}
        viewLabel={context.viewLabel}
        conversations={conversations}
        activeConversationId={conversationId}
        isLoadingConversations={isLoadingConversations}
        isStreaming={isStreaming}
        canStartNew={Boolean(conversationId || messages.length)}
        onNewConversation={startNewConversation}
        onSelectConversation={(id) => {
          void selectConversation(id);
        }}
        onDeleteRequest={setPendingDelete}
        onClose={onClose}
      />

      {emptyHint && messages.length === 0 ? (
        <div className="report-chat-panel__empty">
          <p>{emptyHint}</p>
        </div>
      ) : (
        <ReportChatMessages messages={messages} isStreaming={isStreaming} />
      )}

      {error ? (
        <div className="report-chat-panel__error" role="alert">
          {error}
        </div>
      ) : null}

      <ReportChatComposer
        value={input}
        disabled={isStreaming || isLoadingMessages || !context.area}
        onChange={setInput}
        onSubmit={() => {
          void sendMessage();
        }}
      />

      <ReportChatDeleteDialog
        conversation={pendingDelete}
        open={Boolean(pendingDelete)}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          setIsDeleting(true);
          void deleteConversation(pendingDelete.id)
            .catch(() => undefined)
            .finally(() => {
              setIsDeleting(false);
              setPendingDelete(null);
            });
        }}
      />
    </aside>
  );
}
