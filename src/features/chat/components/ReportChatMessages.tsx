"use client";

import { useEffect, useRef } from "react";

import { ReportChatBubble } from "@/features/chat/components/ReportChatBubble";
import type { ReportChatMessagesProps } from "@/features/chat/components/ReportChatMessages.types";

export function ReportChatMessages({
  messages,
  isStreaming,
}: ReportChatMessagesProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isStreaming]);

  return (
    <div ref={listRef} className="report-chat-panel__messages">
      {messages.length === 0 ? (
        <div className="report-chat-panel__empty">
          <p>
            Ask about targets, cover, YoY trends, or projections for this
            category table.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <ReportChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            isStreaming={isStreaming}
          />
        ))
      )}
    </div>
  );
}
