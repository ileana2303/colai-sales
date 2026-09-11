"use client";

import { AppIcon } from "@/components/ui/app-icon";
import type { ReportChatFabProps } from "@/features/chat/components/ReportChatFab.types";

export function ReportChatFab({ onClick }: ReportChatFabProps) {
  return (
    <button
      type="button"
      className="report-chat-fab"
      aria-label="Άνοιγμα βοηθού πωλήσεων AI"
      onClick={onClick}
    >
      <span className="report-chat-fab__icon" aria-hidden>
        <AppIcon name="bi-stars" size={18} />
      </span>
      <span className="report-chat-fab__copy">
        <span className="report-chat-fab__label">Ρώτησε το AI</span>
        <span className="report-chat-fab__hint">Βοηθός πωλήσεων</span>
      </span>
    </button>
  );
}
