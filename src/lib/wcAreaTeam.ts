import type { Maybe } from "@/types/api/common";
import type { ApiUserInfo } from "@/types/api/schemas";

/** First entry in `listAccessAreaTeam`, if any. */
export function resolveAreaTeamFromUserInfo(
  userInfo: Maybe<ApiUserInfo>,
): string | null {
  const list = userInfo?.listAccessAreaTeam;
  if (!Array.isArray(list) || list.length === 0) return null;

  const value = list[0]?.value?.trim();
  return value || null;
}
