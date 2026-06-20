import { parseProxyJson } from "@/lib/api/client";
import type { AuthMeSuccess, LoginSuccess } from "@/types/api/responses";
import type { ApiUserInfo } from "@/types/api/schemas";

export type AuthMeData = {
  ok: true;
  authenticated: boolean;
  userInfos?: ApiUserInfo | null;
  user?: { username?: string };
};

export async function fetchAuthMe(): Promise<AuthMeData> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  return parseProxyJson<AuthMeSuccess>(res, "Failed to load session.");
}

export async function loginRequest(credentials: {
  username: string;
  password: string;
}): Promise<LoginSuccess> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await parseProxyJson<LoginSuccess>(res, "Αποτυχία σύνδεσης.");

  if (!data.userInfos) {
    throw new Error("Missing user info from login response.");
  }

  return data;
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
