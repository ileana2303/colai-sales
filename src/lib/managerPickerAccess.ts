import type { Maybe } from "@/types/api/common";

const AREA_PICKER_LAST_NAMES = ["Λέντζος", "Kandralidis"] as const;

function normalizePickerLastName(value: unknown): string {
  return String(value ?? "").trim();
}

export function isAreaPickerUser(
  userInfo: Maybe<{ lname?: string | null }>,
): boolean {
  const lname = normalizePickerLastName(userInfo?.lname);
  if (!lname) return false;

  return AREA_PICKER_LAST_NAMES.some(
    (allowed) =>
      lname.localeCompare(allowed, "el", { sensitivity: "base" }) === 0,
  );
}
