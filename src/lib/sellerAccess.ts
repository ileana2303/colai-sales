import type { Maybe } from "@/types/api/common";
import type { ApiUserInfo } from "@/types/api/schemas";

export function normalizeSellerCode(value: unknown): string {
  const text = String(value ?? "").trim();
  return /^\d+$/.test(text) ? text.replace(/^0+(?=\d)/, "") : text;
}

export function isManagerWithoutSellerRole(
  userInfo: Maybe<ApiUserInfo>,
): boolean {
  return userInfo?.isManager === true && userInfo.isSeller !== true;
}

export function canAccessSeller(
  userInfo: Maybe<ApiUserInfo>,
  sellerCode: string,
): boolean {
  const normalizedTarget = normalizeSellerCode(sellerCode);
  const normalizedOwn = normalizeSellerCode(userInfo?.sellerCode);
  if (normalizedOwn && normalizedTarget === normalizedOwn) return true;

  if (!isManagerWithoutSellerRole(userInfo)) return false;

  return (userInfo?.listAccessSellers ?? []).some(
    (seller) => normalizeSellerCode(seller.sellerCode) === normalizedTarget,
  );
}
