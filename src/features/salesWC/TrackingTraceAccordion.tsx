"use client";

import React from "react";

import TrackTraceDetailsModal from "./trackTrace/TrackTraceDetailsModal";
import TrackTraceExpandedContent from "./trackTrace/TrackTraceExpandedContent";
import { useGtTrackAndTrace } from "./trackTrace/useGtTrackAndTrace";

export default function TrackingTraceAccordion({
  voucher,
  showDivider = true,
}: {
  voucher: string;
  showDivider?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { state, loadTrace, prepareLoad } = useGtTrackAndTrace(voucher, open);

  return (
    <>
      <details
        open={open}
        onToggle={(event) => {
          const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
          setOpen(nextOpen);
          if (nextOpen) prepareLoad();
        }}
        style={
          showDivider
            ? { borderBottom: "1px solid var(--bs-border-color-translucent)" }
            : undefined
        }
      >
        <summary
          className="d-flex align-items-center w-100 gap-2 py-2"
          style={{
            listStyle: "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            className="text-primary d-flex align-items-center flex-shrink-0 gap-1"
            style={{ fontSize: 12 }}
          >
            <i className="bi bi-truck" aria-hidden />
            <span>Γενική Ταχυδρομική</span>
          </div>
          <div
            className="fw-medium text-break ms-auto text-end"
            style={{ color: "var(--bs-body-color)", fontSize: 13, minWidth: 0 }}
          >
            {voucher}
          </div>
          <i
            className="bi bi-chevron-down text-secondary d-inline-block flex-shrink-0"
            style={{
              fontSize: "1rem",
              transition: "transform 160ms ease",
              transform: open ? "rotate(-180deg)" : "none",
            }}
            aria-hidden
          />
        </summary>

        {open ? (
          <div className="pb-2">
            <TrackTraceExpandedContent
              state={state}
              onRetry={() => void loadTrace(true)}
              onShowDetails={() => setModalOpen(true)}
            />
          </div>
        ) : null}
      </details>

      <TrackTraceDetailsModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        voucher={voucher}
        state={state}
      />
    </>
  );
}
