const MAVROGENIS_SA_REPORTS_WORKSPACE_ID =
  "a279f8cd-3d0e-4362-af29-2e5af5b043d1";
const MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID =
  "e928997c-ad45-4320-a7d6-b35a8fa8e510";
const POWERBI_SCOPE = "https://analysis.windows.net/powerbi/api/.default";

export const POWERBI_NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export type PowerBiExecuteQueriesResponse = {
  results?: Array<{
    tables?: Array<{
      rows?: Array<Record<string, unknown>>;
    }>;
  }>;
};

export type PowerBiDatasetTarget = {
  datasetId?: string;
  workspaceId?: string;
};

export type PowerBiAuthInfo = {
  mode: "amsa_token_service" | "client_credentials" | "missing";
  tenantId: string | null;
  clientId: string | null;
  hasAmsaApiBaseUrl: boolean;
};

export type PowerBiDataset = {
  id: string;
  name: string;
  webUrl?: string;
  configuredBy?: string;
  isRefreshable?: boolean;
  isEffectiveIdentityRequired?: boolean;
  isEffectiveIdentityRolesRequired?: boolean;
  isOnPremGatewayRequired?: boolean;
  targetStorageMode?: string;
  createdDate?: string;
};

export type PowerBiGroup = {
  id: string;
  name: string;
  type?: string;
  isReadOnly?: boolean;
  isOnDedicatedCapacity?: boolean;
};

type PowerBiDatasetsResponse = {
  value?: PowerBiDataset[];
};

type PowerBiGroupsResponse = {
  value?: PowerBiGroup[];
  ["@odata.count"]?: number;
};

type AmsaPowerBiTokenResponse = {
  statusCode?: number;
  message?: string;
  detailedMessage?: string;
  token?: string;
  token_data?: string;
};

type PowerBiTokenOptions = {
  amsaAccessToken?: string | null;
};

type PowerBiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    ["pbi.error"]?: {
      code?: string;
      details?: unknown[];
      parameters?: Record<string, unknown>;
    };
  };
  message?: string;
};

export class PowerBiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PowerBiRequestError";
    this.status = status;
  }
}

export function escapeDaxString(value: string): string {
  return value.replaceAll('"', '""');
}

export function getDefaultPowerBiWorkspaceId(): string {
  return (
    process.env.POWERBI_GROUP_ID?.trim() ||
    process.env.POWERBI_WORKSPACE_ID?.trim() ||
    MAVROGENIS_SA_REPORTS_WORKSPACE_ID
  );
}

export function getDefaultPowerBiDatasetId(): string {
  return (
    process.env.POWERBI_DATASET_ID?.trim() ||
    MAVROGENIS_SALES_REPORTS_2023_CLP_APP_DATASET_ID
  );
}

export function getPowerBiAuthInfo(): PowerBiAuthInfo {
  const tenantId = process.env.POWERBI_TENANT_ID?.trim() || null;
  const clientId = process.env.POWERBI_CLIENT_ID?.trim() || null;
  const hasAmsaApiBaseUrl = Boolean(process.env.AMSA_API_BASE_URL?.trim());
  const hasClientSecret = Boolean(process.env.POWERBI_CLIENT_SECRET?.trim());

  if (hasAmsaApiBaseUrl) {
    return {
      mode: "amsa_token_service",
      tenantId,
      clientId,
      hasAmsaApiBaseUrl,
    };
  }

  if (tenantId && clientId && hasClientSecret) {
    return {
      mode: "client_credentials",
      tenantId,
      clientId,
      hasAmsaApiBaseUrl,
    };
  }

  return {
    mode: "missing",
    tenantId,
    clientId,
    hasAmsaApiBaseUrl,
  };
}

function getPowerBiDatasetId(target?: PowerBiDatasetTarget): string {
  return target?.datasetId?.trim() || getDefaultPowerBiDatasetId();
}

function getPowerBiWorkspaceId(target?: PowerBiDatasetTarget): string {
  if (target && Object.hasOwn(target, "workspaceId")) {
    return target.workspaceId?.trim() ?? "";
  }

  return (
    process.env.POWERBI_GROUP_ID?.trim() ||
    process.env.POWERBI_WORKSPACE_ID?.trim() ||
    MAVROGENIS_SA_REPORTS_WORKSPACE_ID
  );
}

function getPowerBiExecuteQueriesEndpoint(
  target?: PowerBiDatasetTarget,
): string {
  const datasetId = getPowerBiDatasetId(target);
  const workspaceId = getPowerBiWorkspaceId(target);
  const datasetPath = `datasets/${datasetId}/executeQueries`;

  if (workspaceId) {
    return `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/${datasetPath}`;
  }

  return `https://api.powerbi.com/v1.0/myorg/${datasetPath}`;
}

function getPowerBiDatasetsEndpoint(workspaceId: string): string {
  return `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets`;
}

function getPowerBiGroupsEndpoint(): string {
  return "https://api.powerbi.com/v1.0/myorg/groups";
}

function getPowerBi404Hint(target?: PowerBiDatasetTarget): string {
  const datasetId = getPowerBiDatasetId(target);
  const workspaceId = getPowerBiWorkspaceId(target);

  if (workspaceId) {
    return `Dataset ${datasetId} was not found in workspace ${workspaceId}, or the token cannot access it. Check the dataset ID, workspace access, and dataset Build permission.`;
  }

  return "The request is using the dataset executeQueries route without a workspace ID. Check the dataset ID and dataset Build permission.";
}

function getPowerBiErrorMessage(
  data: PowerBiErrorResponse,
  status: number,
  target?: PowerBiDatasetTarget,
  operation = "Power BI executeQueries",
): string {
  if ("error" in data && data.error) {
    const code =
      data.error.code || data.error["pbi.error"]?.code || `HTTP ${status}`;
    const detail =
      data.error.message ||
      ("message" in data && data.message ? data.message : "");

    const base = detail
      ? `${operation} failed (${code}): ${detail}`
      : `${operation} failed (${code}, HTTP ${status})`;

    if (status === 404 && code === "PowerBIFolderNotFound") {
      return `${base}. Workspace ${getPowerBiWorkspaceId(target) || "My workspace"} was not found, or this token cannot access it. Check that the app/service principal is added to the workspace.`;
    }

    return status === 404 ? `${base}. ${getPowerBi404Hint(target)}` : base;
  }

  if ("message" in data && data.message) {
    return `${operation} failed (HTTP ${status}): ${data.message}`;
  }

  if (status === 404) {
    return `${operation} failed (404). ${getPowerBi404Hint(target)}`;
  }

  return `${operation} failed (HTTP ${status})`;
}

async function getClientCredentialsToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: POWERBI_SCOPE,
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new PowerBiRequestError(
      data.error_description ||
        data.error ||
        "Failed to get Power BI access token",
      500,
    );
  }

  return data.access_token;
}

async function getAmsaPowerBiToken(amsaAccessToken: string): Promise<string> {
  const baseUrl = process.env.AMSA_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new PowerBiRequestError("Missing AMSA_API_BASE_URL.", 500);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/fetch-pbi-token`, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${amsaAccessToken}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new PowerBiRequestError(
      err instanceof Error ? err.message : "Power BI token service failed",
      502,
    );
  }

  const text = await res.text().catch(() => "");
  const data = (
    text
      ? (() => {
          try {
            return JSON.parse(text) as AmsaPowerBiTokenResponse;
          } catch {
            return { message: text } satisfies AmsaPowerBiTokenResponse;
          }
        })()
      : {}
  ) as AmsaPowerBiTokenResponse;

  if (!res.ok) {
    throw new PowerBiRequestError(
      data.detailedMessage ||
        data.message ||
        `Power BI token service failed (HTTP ${res.status})`,
      res.status,
    );
  }

  const backendStatusCode = Number(data.statusCode);
  const token = data.token?.trim() || data.token_data?.trim();

  if (
    (Number.isFinite(backendStatusCode) &&
      backendStatusCode !== 0 &&
      backendStatusCode !== 200) ||
    !token
  ) {
    throw new PowerBiRequestError(
      data.detailedMessage ||
        data.message ||
        "Power BI token service did not return a token.",
      500,
    );
  }

  return token;
}

export async function getPowerBiToken(
  options: PowerBiTokenOptions = {},
): Promise<string> {
  const amsaAccessToken = options.amsaAccessToken?.trim();
  if (amsaAccessToken) {
    return getAmsaPowerBiToken(amsaAccessToken);
  }

  const tenantId = process.env.POWERBI_TENANT_ID?.trim();
  const clientId = process.env.POWERBI_CLIENT_ID?.trim();
  const clientSecret = process.env.POWERBI_CLIENT_SECRET?.trim();

  if (tenantId && clientId && clientSecret) {
    return getClientCredentialsToken(tenantId, clientId, clientSecret);
  }

  throw new PowerBiRequestError(
    "Missing Power BI configuration. Set POWERBI_TENANT_ID, POWERBI_CLIENT_ID and POWERBI_CLIENT_SECRET.",
    500,
  );
}

export async function executePowerBiQuery(
  query: string,
  target?: PowerBiDatasetTarget,
  tokenOptions?: PowerBiTokenOptions,
): Promise<PowerBiExecuteQueriesResponse> {
  const accessToken = await getPowerBiToken(tokenOptions);
  const endpoint = getPowerBiExecuteQueriesEndpoint(target);

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queries: [{ query }],
        serializerSettings: { includeNulls: true },
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new PowerBiRequestError(
      err instanceof Error ? err.message : "Power BI request failed",
      502,
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as
    | PowerBiExecuteQueriesResponse
    | PowerBiErrorResponse;

  if (!upstream.ok) {
    throw new PowerBiRequestError(
      getPowerBiErrorMessage(
        data as PowerBiErrorResponse,
        upstream.status,
        target,
      ),
      upstream.status,
    );
  }

  return data as PowerBiExecuteQueriesResponse;
}

export async function getPowerBiDatasets(
  target?: Pick<PowerBiDatasetTarget, "workspaceId">,
  tokenOptions?: PowerBiTokenOptions,
): Promise<PowerBiDataset[]> {
  const workspaceId =
    target?.workspaceId?.trim() || getDefaultPowerBiWorkspaceId();
  const accessToken = await getPowerBiToken(tokenOptions);

  let upstream: Response;
  try {
    upstream = await fetch(getPowerBiDatasetsEndpoint(workspaceId), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new PowerBiRequestError(
      err instanceof Error ? err.message : "Power BI datasets request failed",
      502,
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as
    | PowerBiDatasetsResponse
    | PowerBiErrorResponse;

  if (!upstream.ok) {
    throw new PowerBiRequestError(
      getPowerBiErrorMessage(
        data as PowerBiErrorResponse,
        upstream.status,
        {
          workspaceId,
        },
        "Power BI datasets request",
      ),
      upstream.status,
    );
  }

  return "value" in data && Array.isArray(data.value) ? data.value : [];
}

export async function getPowerBiGroups(
  tokenOptions?: PowerBiTokenOptions,
): Promise<PowerBiGroup[]> {
  const accessToken = await getPowerBiToken(tokenOptions);

  let upstream: Response;
  try {
    upstream = await fetch(getPowerBiGroupsEndpoint(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new PowerBiRequestError(
      err instanceof Error ? err.message : "Power BI groups request failed",
      502,
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as
    | PowerBiGroupsResponse
    | PowerBiErrorResponse;

  if (!upstream.ok) {
    throw new PowerBiRequestError(
      getPowerBiErrorMessage(
        data as PowerBiErrorResponse,
        upstream.status,
        undefined,
        "Power BI groups request",
      ),
      upstream.status,
    );
  }

  return "value" in data && Array.isArray(data.value) ? data.value : [];
}
