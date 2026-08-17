"use client";

import { ReportChatMarkdown } from "@/features/chat/components/ReportChatMarkdown";
import type { ReportChatBubbleProps } from "@/features/chat/components/ReportChatBubble.types";
import { cn } from "@/lib/utils";

export function ReportChatBubble({
  role,
  content,
  isStreaming = false,
}: ReportChatBubbleProps) {
  const isAssistant = role === "assistant";
  const fallback = isStreaming ? "…" : "";

  return (
    <div
      className={cn(
        "report-chat-bubble",
        isAssistant
          ? "report-chat-bubble--assistant"
          : "report-chat-bubble--user",
      )}
    >
      <div className="report-chat-bubble__role">
        {isAssistant ? "Assistant" : "You"}
      </div>
      <div className="report-chat-bubble__content">
        {isAssistant ? (
          content ? (
            <ReportChatMarkdown content={content} />
          ) : (
            fallback
          )
        ) : (
          content || fallback
        )}
      </div>
    </div>
  );
}
