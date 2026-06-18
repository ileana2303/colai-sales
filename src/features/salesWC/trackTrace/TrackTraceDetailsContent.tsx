import { formatElGRDateTime } from "@/lib/utils/date";
import type { TrackAndTraceResult } from "@/types/api";

import TrackTraceCheckpointItem from "./TrackTraceCheckpointItem";
import TrackTraceSummaryItem from "./TrackTraceSummaryItem";
import { sortCheckpoints } from "./utils";

export default function TrackTraceDetailsContent({
  info,
}: {
  info: TrackAndTraceResult;
}) {
  const checkpoints = sortCheckpoints(info.checkpoints ?? []);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="track-trace-summary">
        <TrackTraceSummaryItem
          icon="bi-person"
          label="Παραλήπτης"
          value={info.consignee}
        />
        <TrackTraceSummaryItem
          icon="bi-calendar-check"
          label="Ημ. παράδοσης"
          value={formatElGRDateTime(info.deliveryDate)}
        />
        {info.returningServiceVoucher ? (
          <TrackTraceSummaryItem
            icon="bi-arrow-return-left"
            label="Voucher επιστροφής"
            value={info.returningServiceVoucher}
            copyable
          />
        ) : null}
      </div>

      {checkpoints.length ? (
        <div>
          <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>
            Ιστορικό κινήσεων
          </div>
          <div className="track-trace-timeline">
            {checkpoints.map((checkpoint, index) => (
              <TrackTraceCheckpointItem
                key={`${checkpoint.statusCode}-${checkpoint.statusDate}-${index}`}
                checkpoint={checkpoint}
                isLatest={index === 0}
                isLast={index === checkpoints.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-secondary small">
          Δεν υπάρχουν καταχωρημένα σημεία.
        </div>
      )}
    </div>
  );
}
