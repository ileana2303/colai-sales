"use client";

import { Modal } from "react-bootstrap";

import TrackTraceDetailsContent from "./TrackTraceDetailsContent";
import type { TrackTraceState } from "./types";

export default function TrackTraceDetailsModal({
  show,
  onHide,
  voucher,
  state,
}: {
  show: boolean;
  onHide: () => void;
  voucher: string;
  state: TrackTraceState;
}) {
  const info = state.data?.tracking_info;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="track-trace-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Γενική Ταχυδρομική</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-secondary small mb-3">{voucher}</div>

        {!info ? (
          <div className="text-secondary small">
            Δεν υπάρχουν διαθέσιμα στοιχεία.
          </div>
        ) : (
          <TrackTraceDetailsContent info={info} />
        )}
      </Modal.Body>
    </Modal>
  );
}
