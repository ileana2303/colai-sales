"use client";

import type { ReactNode } from "react";

import AppLoader from "@/components/ui/AppLoader";
import { ReportError } from "@/features/powerBI/ReportShared";

type ReportQueryBoundaryProps = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  fallbackError: string;
  onRetry: () => void;
  loadingLabel?: string;
  children: ReactNode;
};

export function ReportQueryBoundary({
  isLoading,
  isError,
  error,
  fallbackError,
  onRetry,
  loadingLabel = "Φόρτωση Power BI...",
  children,
}: ReportQueryBoundaryProps) {
  if (isLoading) {
    return <AppLoader label={loadingLabel} />;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : fallbackError;
    return <ReportError message={message} onRetry={onRetry} />;
  }

  return <>{children}</>;
}

export function getReportQueryErrorMessage(
  error: unknown,
  fallbackError: string,
): string {
  return error instanceof Error ? error.message : fallbackError;
}
