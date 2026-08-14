import { parseProxyJson } from "@/lib/api/client";
import type { EnsureSellersByAreaResponse } from "@/lib/sellersByArea/types";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

export type { EnsureSellersByAreaResponse } from "@/lib/sellersByArea/types";

export async function ensureSellersByAreaCatalog() {
  const res = await fetch("/api/sellers-by-area/ensure", {
    method: "POST",
    cache: "no-store",
    headers: NO_CACHE_HEADERS,
  });
  return parseProxyJson<EnsureSellersByAreaResponse>(
    res,
    "Failed to ensure area sellers catalog.",
  );
}
