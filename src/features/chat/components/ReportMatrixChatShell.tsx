"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ReportChatFab } from "@/features/chat/components/ReportChatFab";
import { ReportChatPanel } from "@/features/chat/components/ReportChatPanel";
import type { ReportMatrixChatShellProps } from "@/features/chat/components/ReportMatrixChatShell.types";
import { useReportChatContext } from "@/features/chat/hooks/useReportChatContext";
import { cn } from "@/lib/utils";

export function ReportMatrixChatShell({
  children,
  brandLabel,
  reportKey,
  snapshotPageCode,
  currentYear,
  previousYear,
  snapshotDate,
  viewLabel,
}: ReportMatrixChatShellProps) {
  const [open, setOpen] = useState(false);
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const headerActions = isClient
    ? document.getElementById("app-header-ask-ai")
    : null;
  const context = useReportChatContext({
    brandLabel,
    reportKey,
    snapshotPageCode,
    currentYear,
    previousYear,
    snapshotDate,
    viewLabel,
  });

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new Event("resize"));
  }, [open]);

  return (
    <div className={cn("report-chat-shell", open && "report-chat-shell--open")}>
      <div className="report-chat-main">
        <div className="app-page">{children}</div>
      </div>

      {open ? (
        <ReportChatPanel context={context} onClose={() => setOpen(false)} />
      ) : headerActions ? (
        createPortal(
          <ReportChatFab onClick={() => setOpen(true)} />,
          headerActions,
        )
      ) : null}
    </div>
  );
}
