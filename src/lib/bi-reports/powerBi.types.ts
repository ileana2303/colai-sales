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

export type AmsaPowerBiTokenResponse = {
  statusCode?: number;
  message?: string;
  detailedMessage?: string;
  token?: string;
  token_data?: string;
};

export type PowerBiTokenOptions = {
  amsaAccessToken?: string | null;
};

export type PowerBiExecuteQueryOptions = {
  includeNulls?: boolean;
};

export type PowerBiErrorResponse = {
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
