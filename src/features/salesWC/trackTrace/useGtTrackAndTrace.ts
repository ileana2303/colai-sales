"use client";

import React from "react";

import { fetchGtTrackAndTrace } from "./fetchGtTrackAndTrace";
import type { TrackTraceState } from "./types";

const emptyState: TrackTraceState = {
  loading: false,
  error: null,
  data: null,
};

export function useGtTrackAndTrace(voucher: string, enabled: boolean) {
  const [state, setState] = React.useState<TrackTraceState>(emptyState);
  const fetchedVoucherRef = React.useRef<string | null>(null);

  const loadTrace = React.useCallback(
    async (force = false) => {
      const trimmed = voucher.trim();
      if (!trimmed || trimmed === "-") return;
      if (force) {
        fetchedVoucherRef.current = null;
      } else if (fetchedVoucherRef.current === trimmed) {
        return;
      }

      setState((prev) => ({
        loading: true,
        error: null,
        data: force ? null : prev.data,
      }));

      try {
        const data = await fetchGtTrackAndTrace(trimmed);
        fetchedVoucherRef.current = trimmed;
        setState({
          loading: false,
          error: null,
          data,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load tracking info";
        setState((prev) => ({
          loading: false,
          error: message,
          data: prev.data,
        }));
      }
    },
    [voucher],
  );

  const prepareLoad = React.useCallback(() => {
    if (fetchedVoucherRef.current !== voucher.trim()) {
      setState({ loading: true, error: null, data: null });
    }
  }, [voucher]);

  React.useEffect(() => {
    if (enabled) void loadTrace();
  }, [enabled, loadTrace]);

  return {
    state,
    loadTrace,
    prepareLoad,
  };
}
