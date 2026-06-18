import { displayValue } from "@/lib/utils/string";

import { getTrackStatusIcon, getTrackStatusTone } from "./utils";

export default function TrackTraceStatusBlock({
  status,
  statusCode,
}: {
  status: string | null | undefined;
  statusCode: string | null | undefined;
}) {
  const statusTone = getTrackStatusTone(status, statusCode);

  return (
    <div className={`track-trace-status track-trace-status--${statusTone}`}>
      <div className="track-trace-status__icon">
        <i className={`bi ${getTrackStatusIcon(statusTone)}`} aria-hidden />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="text-secondary small">Τρέχουσα κατάσταση</div>
        <div className="fw-semibold">{displayValue(status)}</div>
      </div>
    </div>
  );
}
