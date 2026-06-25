import {
  getUserDisplayName,
  resolveBiReportPowerBiTarget,
} from "@/lib/bi-reports/biReports";
import {
  executePowerBiQuery,
  joinDaxQuery,
  type PowerBiExecuteQueriesResponse,
  type PowerBiTokenOptions,
} from "@/lib/bi-reports/powerBi";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import type { ApiUserInfo } from "@/types/api/schemas";
import type { SessionUserInfo } from "@/lib/sessionUser";

export type PowerBiSellerRow = {
  sellerCode: string;
  salesPerson: string;
  team: string;
  area: string;
};

export type ResolvedReportSellerContext = {
  area: string;
  team: string;
  sellerCode: string;
  sellerName: string;
};

const SELLERS_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

let sellersCatalogCache: {
  fetchedAt: number;
  records: PowerBiSellerRow[];
} | null = null;

function toNullableString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function readString(row: Record<string, unknown>, key: string): string {
  return toNullableString(row[`[${key}]`] ?? row[key]);
}

export function buildPowerBiSellersQuery(): string {
  return joinDaxQuery([
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  'ASP_EBS_SELLERS',",
    '  "SellerCode", \'ASP_EBS_SELLERS\'[SellerCode],',
    '  "SalesPerson", \'ASP_EBS_SELLERS\'[Sales Person],',
    '  "Team", \'ASP_EBS_SELLERS\'[Team],',
    '  "Area", \'ASP_EBS_SELLERS\'[Area]',
    ")",
    "ORDER BY [Area], [Team], [SalesPerson]",
  ]);
}

export function normalizePowerBiSellerRows(
  response: PowerBiExecuteQueriesResponse,
): PowerBiSellerRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    sellerCode: readString(row, "SellerCode"),
    salesPerson: readString(row, "SalesPerson"),
    team: readString(row, "Team"),
    area: readString(row, "Area"),
  }));
}

function normalizeArea(area: string | null | undefined): string {
  return String(area ?? "")
    .trim()
    .toLocaleUpperCase("el-GR");
}

export function findPowerBiSellersByArea(
  records: PowerBiSellerRow[],
  area: string,
): PowerBiSellerRow[] {
  const normalizedTarget = normalizeArea(area);
  if (!normalizedTarget) return [];

  return records.filter(
    (row) => normalizeArea(row.area) === normalizedTarget,
  );
}

export function findPowerBiSellerByCode(
  records: PowerBiSellerRow[],
  sellerCode: string,
): PowerBiSellerRow | null {
  const normalizedTarget = normalizeSellerCode(sellerCode);
  if (!normalizedTarget) return null;

  return (
    records.find(
      (row) => normalizeSellerCode(row.sellerCode) === normalizedTarget,
    ) ?? null
  );
}

export async function fetchPowerBiSellersCatalog(
  tokenOptions: PowerBiTokenOptions,
  options: { forceRefresh?: boolean } = {},
): Promise<PowerBiSellerRow[]> {
  if (
    !options.forceRefresh &&
    sellersCatalogCache &&
    Date.now() - sellersCatalogCache.fetchedAt < SELLERS_CATALOG_CACHE_TTL_MS
  ) {
    return sellersCatalogCache.records;
  }

  const response = await executePowerBiQuery(
    buildPowerBiSellersQuery(),
    resolveBiReportPowerBiTarget("sellers"),
    tokenOptions,
  );
  const records = normalizePowerBiSellerRows(response);

  sellersCatalogCache = {
    fetchedAt: Date.now(),
    records,
  };

  return records;
}

export async function resolveReportSellerContext(
  userInfo: SessionUserInfo | ApiUserInfo | null,
  tokenOptions: PowerBiTokenOptions,
): Promise<ResolvedReportSellerContext | null> {
  const area = userInfo?.area?.trim();
  if (!area) return null;

  const records = await fetchPowerBiSellersCatalog(tokenOptions);
  const areaSellers = findPowerBiSellersByArea(records, area);
  if (!areaSellers.length) return null;

  return {
    area,
    team: userInfo?.team?.trim() ?? areaSellers[0]?.team ?? "",
    sellerCode: normalizeSellerCode(userInfo?.sellerCode) ?? "",
    sellerName: getUserDisplayName(userInfo),
  };
}
