"use client";

import Link from "next/link";

import { AppIcon } from "@/components/ui/app-icon";
import { usePowerBiGroups } from "@/features/powerBI/hooks/usePowerBiReports";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { ReportHeader } from "@/features/powerBI/ReportShared";
import type { PowerBiGroup } from "@/lib/bi-reports/powerBi";

function boolLabel(value?: boolean) {
  return value ? "Ναι" : "Όχι";
}

function GroupCard({ group }: { group: PowerBiGroup }) {
  const href = group.id
    ? `/powerbi/groups/${encodeURIComponent(group.id)}/datasets?name=${encodeURIComponent(group.name)}`
    : "";

  const card = (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold truncate">{group.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {group.type || "Workspace"}
          </div>
        </div>
        {href ? (
          <AppIcon
            name="bi-chevron-right"
            className="text-muted-foreground shrink-0"
          />
        ) : null}
      </div>

      <div
        className="rounded-xl bg-muted text-sm text-muted-foreground mt-3 p-2"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowWrap: "anywhere",
        }}
      >
        {group.id}
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-2">
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Dedicated
            </div>
            <div className="font-semibold mt-1">
              {boolLabel(group.isOnDedicatedCapacity)}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Read only
            </div>
            <div className="font-semibold mt-1">
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
      className="no-underline"
      style={{ color: "inherit" }}
    >
      {card}
    </Link>
  );
}

export function PowerBiGroupsPage() {
  const { data, error, isLoading, isError, refetch } = usePowerBiGroups();
  const groups = data?.groups ?? [];

  return (
    <div className="app-page">
      <ReportHeader
        title="Groups"
        subtitle="Workspaces διαθέσιμα στο Power BI tenant"
        icon="bi-grid-3x3-gap"
      />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        fallbackError="Failed to load Power BI groups"
        loadingLabel="Φόρτωση Power BI groups..."
        onRetry={() => void refetch()}
      >
        {groups.length ? (
          <section className="app-list-grid">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </section>
        ) : (
          <div className="app-card p-5 text-center text-muted-foreground">
            Δεν βρέθηκαν Power BI groups.
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
