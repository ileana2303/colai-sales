import { formatElGRDateTime } from "@/lib/utils/date";
import { displayValue } from "@/lib/utils/string";
import type { Checkpoint } from "@/types/api";

import { getTrackStatusIcon, getTrackStatusTone } from "./utils";

export default function TrackTraceCheckpointItem({
  checkpoint,
  isLatest,
  isLast,
}: {
  checkpoint: Checkpoint;
  isLatest: boolean;
  isLast: boolean;
}) {
  const tone = getTrackStatusTone(checkpoint.status, checkpoint.statusCode);

  return (
    <div
      className={`track-trace-step${isLast ? "track-trace-step--last" : ""}`}
    >
      <div className={`track-trace-step__dot track-trace-step__dot--${tone}`}>
        <i className={`bi ${getTrackStatusIcon(tone)}`} aria-hidden />
      </div>
      <div className="track-trace-step__body">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="fw-semibold">{displayValue(checkpoint.status)}</div>
          </div>
          {isLatest ? (
            <span className="badge rounded-pill text-bg-primary flex-shrink-0">
              Τελευταίο
            </span>
          ) : null}
        </div>
        <div className="text-secondary small mt-1">
          <i className="bi bi-calendar3 me-1" aria-hidden />
          {formatElGRDateTime(checkpoint.statusDate)}
        </div>
        {checkpoint.shop ? (
          <div className="text-secondary small mt-1">
            <i className="bi bi-shop me-1" aria-hidden />
            {checkpoint.shop}
          </div>
        ) : null}
      </div>
    </div>
  );
}
