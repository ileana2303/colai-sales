"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportChatMarkdownProps } from "@/features/chat/components/ReportChatMarkdown.types";

const markdownComponents: Components = {
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="report-chat-table">
        <Table className="w-max min-w-full text-xs">{children}</Table>
      </div>
    );
  },
  thead({ children }) {
    return <TableHeader>{children}</TableHeader>;
  },
  tbody({ children }) {
    return <TableBody>{children}</TableBody>;
  },
  tfoot({ children }) {
    return <TableFooter>{children}</TableFooter>;
  },
  tr({ children }) {
    return <TableRow className="hover:bg-muted/40">{children}</TableRow>;
  },
  th({ children }) {
    return <TableHead className="px-3">{children}</TableHead>;
  },
  td({ children }) {
    return <TableCell className="px-3 tabular-nums">{children}</TableCell>;
  },
};

export function ReportChatMarkdown({ content }: ReportChatMarkdownProps) {
  return (
    <div className="report-chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
