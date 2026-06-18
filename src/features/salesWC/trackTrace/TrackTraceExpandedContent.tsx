import { Alert } from "react-bootstrap";

import { displayValue } from "@/lib/utils/string";

import TrackTraceStatusBlock from "./TrackTraceStatusBlock";
import type { TrackTraceState } from "./types";

export default function TrackTraceExpandedContent({
  state,
  onRetry,
  onShowDetails,
}: {
  state: TrackTraceState;
  onRetry: () => void;
  onShowDetails: () => void;
}) {
  if (!state.data && !state.error) {
    return (
      <div className="d-flex align-items-center text-secondary gap-2 py-1">
        <span className="spinner-border spinner-border-sm" aria-hidden />
        <span style={{ fontSize: 13 }}>Φόρτωση ιστορικού αποστολής...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert variant="danger" className="mb-0 py-2">
        <div style={{ fontSize: 13 }}>{state.error}</div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger mt-2"
          onClick={onRetry}
        >
          Δοκιμή ξανά
        </button>
      </Alert>
    );
  }

  const info = state.data?.tracking_info;
  if (!state.data?.isSuccess || !info) {
    return (
      <Alert variant="warning" className="mb-0 py-2" style={{ fontSize: 13 }}>
        {displayValue(
          state.data?.errorMessage ||
            state.data?.message ||
            "Δεν βρέθηκαν στοιχεία παρακολούθησης.",
        )}
      </Alert>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      <TrackTraceStatusBlock
        status={info.status}
        statusCode={String(info.result ?? "")}
      />
      <button
        type="button"
        className="btn btn-sm btn-link text-primary align-self-start px-0"
        style={{ fontSize: 13 }}
        onClick={onShowDetails}
      >
        Λεπτομέρειες αποστολής
        <i className="bi bi-box-arrow-up-right ms-1" aria-hidden />
      </button>
      {state.loading ? (
        <div className="text-secondary small">Ενημέρωση...</div>
      ) : null}
    </div>
  );
}
