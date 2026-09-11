import type { Maybe } from "@/types/api/common";

type UserAreaSource = Maybe<{
  area?: string | null;
  travmaArea?: string | null;
}>;

const UNAVAILABLE_AREA_VALUES = new Set(["n/a", "na"]);

function normalizeAreaValue(value: unknown): string {
  return String(value ?? "").trim();
}

function isUnavailableArea(area: string): boolean {
  const normalized = area.toLowerCase();
  return !normalized || UNAVAILABLE_AREA_VALUES.has(normalized);
}

export function resolveUserArea(userInfo: UserAreaSource): string {
  const area = normalizeAreaValue(userInfo?.area);
  if (!isUnavailableArea(area)) return area;

  return normalizeAreaValue(userInfo?.travmaArea);
}
