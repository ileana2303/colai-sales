"use client";

import { useParams, useSearchParams } from "next/navigation";

import { usePowerBiDatasets } from "@/features/powerBI/hooks/usePowerBiReports";
import { ReportQueryBoundary } from "@/features/powerBI/ReportQueryBoundary";
import { ReportHeader } from "@/features/powerBI/ReportShared";
import type { PowerBiDataset } from "@/lib/bi-reports/powerBi";

function boolLabel(value?: boolean) {
  return value ? "Ναι" : "Όχι";
}

function DatasetCard({ dataset }: { dataset: PowerBiDataset }) {
  const card = (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold truncate">{dataset.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {dataset.targetStorageMode || "Dataset"}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl bg-muted text-sm text-muted-foreground mt-3 p-2"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowWrap: "anywhere",
        }}
      >
        {dataset.id}
      </div>

      <div className="app-metric-grid app-metric-grid--2 mt-2">
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Refreshable
            </div>
            <div className="font-semibold mt-1">
              {boolLabel(dataset.isRefreshable)}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Gateway
            </div>
            <div className="font-semibold mt-1">
              {boolLabel(dataset.isOnPremGatewayRequired)}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Identity
            </div>
            <div className="font-semibold mt-1">
              {boolLabel(dataset.isEffectiveIdentityRequired)}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl bg-muted p-2">
            <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.1 }}>
              Roles
            </div>
            <div className="font-semibold mt-1">
              {boolLabel(dataset.isEffectiveIdentityRolesRequired)}
            </div>
          </div>
        </div>
      </div>

      {dataset.configuredBy ? (
        <div className="text-sm text-muted-foreground truncate mt-3">
          Configured by {dataset.configuredBy}
        </div>
      ) : null}
    </div>
  );

  return card;
}

export function PowerBiDatasetsPage() {
  const params = useParams<{ groupId: string }>();
  const searchParams = useSearchParams();
  const groupId = params.groupId ?? "";
  const groupName = searchParams.get("name") || groupId;

  const { data, error, isLoading, isError, refetch } =
    usePowerBiDatasets(groupId);
  const datasets = data?.datasets ?? [];

  return (
    <div className="app-page">
      <ReportHeader title="Datasets" subtitle={groupName} icon="bi-database" />

      <ReportQueryBoundary
        isLoading={isLoading}
        isError={isError || !groupId}
        error={groupId ? error : new Error("Missing Power BI group id")}
        fallbackError="Failed to load Power BI datasets"
        loadingLabel="Φόρτωση Power BI datasets..."
        onRetry={() => void refetch()}
      >
        {datasets.length ? (
          <section className="app-list-grid">
            {datasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </section>
        ) : (
          <div className="app-card p-5 text-center text-muted-foreground">
            Δεν βρέθηκαν Power BI datasets.
          </div>
        )}
      </ReportQueryBoundary>
    </div>
  );
}
