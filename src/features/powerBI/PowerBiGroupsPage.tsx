"use client";

import React from "react";
import Link from "next/link";

import AppLoader from "@/components/ui/AppLoader";
import { ReportError, ReportHeader } from "@/features/powerBI/ReportShared";
import { parseProxyJson } from "@/lib/api/client";
import type { BiReportGroupsResponse } from "@/lib/bi-reports/biReports";
import type { PowerBiGroup } from "@/lib/bi-reports/powerBi";

function boolLabel(value?: boolean) {
  return value ? "Ναι" : "Όχι";
}

function GroupCard({ group }: { group: PowerBiGroup }) {
  const href = group.id
    ? `/powerbi/groups/${encodeURIComponent(group.id)}/datasets?name=${encodeURIComponent(group.name)}`
    : "";

  const card = (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-bold text-truncate">{group.name}</div>
          <div className="small text-secondary text-truncate">
            {group.type || "Workspace"}
          </div>
        </div>
        {href ? (
          <i
            className="bi bi-chevron-right text-secondary flex-shrink-0"
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className="rounded-4 bg-body-tertiary small text-secondary mt-3 p-2"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowWrap: "anywhere",
        }}
      >
        {group.id}
      </div>

      <div className="row g-2 mt-2">
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Dedicated
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(group.isOnDedicatedCapacity)}
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Read only
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(group.isReadOnly)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="text-decoration-none"
      style={{ color: "var(--bs-body-color)" }}
    >
      {card}
    </Link>
  );
}

export function PowerBiGroupsPage() {
  const [groups, setGroups] = React.useState<PowerBiGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadGroups = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/powerbi/groups", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await parseProxyJson<BiReportGroupsResponse>(
        res,
        "Failed to load Power BI groups",
      );

      setGroups(data.groups ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load Power BI groups";
      setError(message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  return (
    <div className="d-flex flex-column gap-3">
      <ReportHeader
        title="Groups"
        subtitle="Workspaces διαθέσιμα στο Power BI tenant"
        icon="bi-grid-3x3-gap"
      />

      {loading ? (
        <AppLoader label="Φόρτωση Power BI groups..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadGroups()} />
      ) : groups.length ? (
        <section className="d-flex flex-column gap-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </section>
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν Power BI groups.
        </div>
      )}
    </div>
  );
}
