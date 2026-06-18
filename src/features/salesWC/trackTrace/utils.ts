import type { Checkpoint } from "@/types/api";

import type { TrackStatusTone } from "./types";

export const TRACK_STATUS_DELIVERED = "ΠΑΡΑΔΟΜΕΝΟ";
export const TRACK_STATUS_PENDING = "ΠΡΟΣ ΠΑΡΑΔΟΣΗ";

function normalizeTrackStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("el-GR");
}

function resolveTrackStatusLabel(
  status: string | null | undefined,
  statusCode: string | null | undefined,
): string {
  const normalizedStatus = normalizeTrackStatus(status);
  if (normalizedStatus) return normalizedStatus;

  return normalizeTrackStatus(statusCode);
}

export function getTrackStatusTone(
  status: string | null | undefined,
  statusCode: string | null | undefined,
): TrackStatusTone {
  const label = resolveTrackStatusLabel(status, statusCode);

  if (label === TRACK_STATUS_PENDING) return "warning";
  if (label === TRACK_STATUS_DELIVERED) return "success";

  return "secondary";
}

export function getTrackStatusIcon(tone: TrackStatusTone): string {
  if (tone === "success") return "bi-check-circle-fill";
  if (tone === "warning") return "bi-hourglass-split";
  return "bi-clock-history";
}

export function sortCheckpoints(items: Checkpoint[]): Checkpoint[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.statusDate).getTime();
    const bTime = new Date(b.statusDate).getTime();
    return (
      (Number.isFinite(bTime) ? bTime : 0) -
      (Number.isFinite(aTime) ? aTime : 0)
    );
  });
}
