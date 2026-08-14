"use client";

import type { ReportChatBubbleProps } from "@/features/chat/components/ReportChatBubble.types";
import { cn } from "@/lib/utils";

export function ReportChatBubble({
  role,
  content,
  isStreaming = false,
}: ReportChatBubbleProps) {
  return (
    <div
      className={cn(
        "report-chat-bubble",
        role === "user"
          ? "report-chat-bubble--user"
          : "report-chat-bubble--assistant",
      )}
    >
      <div className="report-chat-bubble__role">
        {role === "user" ? "You" : "Assistant"}
      </div>
      <div className="report-chat-bubble__content">
        {content || (isStreaming ? "…" : "")}
      </div>
    </div>
  );
}
