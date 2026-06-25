import type { ApiUserInfo } from "@/types/api/schemas";
import {
  type SessionUserInfo,
  toSessionUserInfo,
} from "@/lib/sessionUser";
import { getObject } from "@/lib/utils/json";

export type { SessionUserInfo } from "@/lib/sessionUser";
export { toSessionUserInfo } from "@/lib/sessionUser";

export const cookieName = "session-colai";
export const userCookieName = "amsa_user";

export function encodeUserInfoCookie(userInfos: ApiUserInfo): string | null {
  const sessionUser = toSessionUserInfo(userInfos);
  if (!sessionUser) return null;

  return Buffer.from(JSON.stringify(sessionUser), "utf8").toString("base64url");
}

export function decodeUserInfoCookie(value?: string): SessionUserInfo | null {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = getObject(JSON.parse(decoded));
    if (!parsed || typeof parsed.userID !== "number") return null;
    return parsed as SessionUserInfo;
  } catch {
    return null;
  }
}

export async function verifySession(token?: string | null) {
  // Replace with your real validation logic.
  // Keep this server-safe (Node runtime), not middleware-edge unless using jose.
  return Boolean(token);
}
