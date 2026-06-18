import type { GetGtTrackAndTraceSuccess } from "@/types/api";

export type TrackTraceState = {
  loading: boolean;
  error: string | null;
  data: GetGtTrackAndTraceSuccess | null;
};

export type TrackStatusTone =
  | "success"
  | "warning"
  | "secondary"
  | "primary"
  | "danger";
