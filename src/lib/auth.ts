import type { ApiUserInfo } from "@/types/api/schemas";
import { getObject } from "@/lib/utils/json";

export const cookieName = "session-colai";
export const userCookieName = "amsa_user";

export function decodeUserInfoCookie(value?: string): ApiUserInfo | null {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    return getObject(parsed) ? (parsed as ApiUserInfo) : null;
  } catch {
    return null;
  }
}

export async function verifySession(token?: string | null) {
  // Replace with your real validation logic.
  // Keep this server-safe (Node runtime), not middleware-edge unless using jose.
  return Boolean(token);
}
