import type { Maybe } from "@/types/api/common";

const AI_CHAT_LAST_NAME = "Kandralidis";

function normalizeLastName(value: unknown): string {
  return String(value ?? "").trim();
}

export function isAiChatUser(
  userInfo: Maybe<{ lname?: string | null }>,
): boolean {
  const lname = normalizeLastName(userInfo?.lname);
  if (!lname) return false;

  return (
    lname.localeCompare(AI_CHAT_LAST_NAME, "el", { sensitivity: "base" }) === 0
  );
}
