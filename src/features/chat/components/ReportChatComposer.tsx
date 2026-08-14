"use client";

import { useEffect, useRef } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import type { ReportChatComposerProps } from "@/features/chat/components/ReportChatComposer.types";

export function ReportChatComposer({
  value,
  disabled,
  onChange,
  onSubmit,
}: ReportChatComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="report-chat-panel__composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={inputRef}
        className="report-chat-panel__input"
        rows={2}
        value={value}
        placeholder="Ask about this report…"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="submit"
        size="icon"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
      >
        <AppIcon name="bi-send" size={16} />
      </Button>
    </form>
  );
}
