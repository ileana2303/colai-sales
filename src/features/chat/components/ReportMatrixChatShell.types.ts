import type { ReactNode } from "react";

import type { UseReportChatContextInput } from "@/features/chat/hooks/useReportChatContext.types";

export type ReportMatrixChatShellProps = UseReportChatContextInput & {
  children: ReactNode;
};
