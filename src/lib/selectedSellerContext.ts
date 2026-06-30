import { getObject } from "@/lib/utils/json";

export const selectedSellerCookieName = "amsa_selected_seller";

export type SelectedSellerContext = {
  area: string;
  sellerCode: string;
  salesPerson: string;
  team: string;
};

export function encodeSelectedSellerCookie(
  context: SelectedSellerContext,
): string {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

export function decodeSelectedSellerCookie(
  value?: string,
): SelectedSellerContext | null {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = getObject(JSON.parse(decoded));
    if (!parsed) return null;

    const area = String(parsed.area ?? "").trim();
    const sellerCode = String(parsed.sellerCode ?? "").trim();
    const salesPerson = String(parsed.salesPerson ?? "").trim();
    const team = String(parsed.team ?? "").trim();

    if (!area || !sellerCode || !salesPerson) return null;

    return { area, sellerCode, salesPerson, team };
  } catch {
    return null;
  }
}
