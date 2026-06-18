"use client";

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import AppLoader from "@/components/ui/AppLoader";
import { ReportError, ReportHeader } from "@/features/powerBI/ReportShared";
import { parseProxyJson } from "@/lib/api/client";
import type { BiReportDatasetsResponse } from "@/lib/bi-reports/biReports";
import type { PowerBiDataset } from "@/lib/bi-reports/powerBi";

function boolLabel(value?: boolean) {
  return value ? "Ναι" : "Όχι";
}

function DatasetCard({ dataset }: { dataset: PowerBiDataset }) {
  const card = (
    <div className="app-card p-3">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-bold text-truncate">{dataset.name}</div>
          <div className="small text-secondary text-truncate">
            {dataset.targetStorageMode || "Dataset"}
          </div>
        </div>
      </div>

      <div
        className="rounded-4 bg-body-tertiary small text-secondary mt-3 p-2"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowWrap: "anywhere",
        }}
      >
        {dataset.id}
      </div>

      <div className="row g-2 mt-2">
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Refreshable
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(dataset.isRefreshable)}
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Gateway
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(dataset.isOnPremGatewayRequired)}
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Identity
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(dataset.isEffectiveIdentityRequired)}
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="rounded-4 bg-body-tertiary p-2">
            <div className="small text-secondary" style={{ lineHeight: 1.1 }}>
              Roles
            </div>
            <div className="fw-semibold mt-1">
              {boolLabel(dataset.isEffectiveIdentityRolesRequired)}
            </div>
          </div>
        </div>
      </div>

      {dataset.configuredBy ? (
        <div className="small text-secondary text-truncate mt-3">
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

  const [datasets, setDatasets] = React.useState<PowerBiDataset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDatasets = React.useCallback(async () => {
    if (!groupId) {
      setError("Missing Power BI group id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/powerbi/groups/${encodeURIComponent(groupId)}/datasets`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );
      const data = await parseProxyJson<BiReportDatasetsResponse>(
        res,
        "Failed to load Power BI datasets",
      );

      setDatasets(data.datasets ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load Power BI datasets";
      setError(message);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  return (
    <div className="d-flex flex-column gap-3">
      <ReportHeader title="Datasets" subtitle={groupName} icon="bi-database" />

      <Link
        href="/powerbi/groups"
        className="btn btn-sm btn-outline-secondary align-self-start"
      >
        <i className="bi bi-chevron-left me-1" aria-hidden />
        Groups
      </Link>

      {loading ? (
        <AppLoader label="Φόρτωση Power BI datasets..." />
      ) : error ? (
        <ReportError message={error} onRetry={() => void loadDatasets()} />
      ) : datasets.length ? (
        <section className="d-flex flex-column gap-2">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </section>
      ) : (
        <div className="app-card text-secondary p-3 text-center">
          Δεν βρέθηκαν Power BI datasets.
        </div>
      )}
    </div>
  );
}
