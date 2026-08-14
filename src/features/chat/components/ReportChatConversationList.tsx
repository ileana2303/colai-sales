"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportChatConversationListProps } from "@/features/chat/components/ReportChatConversationList.types";
import {
  formatConversationTimestamp,
  formatConversationTitle,
} from "@/features/chat/lib/format";
import { cn } from "@/lib/utils";

export function ReportChatConversationList({
  conversations,
  activeConversationId,
  isLoading,
  disabled,
  onSelect,
  onDeleteRequest,
}: ReportChatConversationListProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label="Conversation history"
        title="Conversation history"
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] outline-none transition-colors",
          "hover:bg-muted hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <AppIcon name="bi-clipboard-data" size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Conversations
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No conversations yet.
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-start gap-1 rounded-lg px-1 py-1",
                  isActive && "bg-muted/70",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left hover:bg-muted/80"
                  onClick={() => onSelect(conversation.id)}
                >
                  <div className="truncate text-sm font-medium">
                    {formatConversationTitle(conversation)}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatConversationTimestamp(conversation.updated_at)}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="mt-1 text-destructive opacity-70 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  onClick={() => onDeleteRequest(conversation)}
                >
                  <AppIcon name="bi-trash" size={12} />
                </Button>
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
