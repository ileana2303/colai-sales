import { parseProxyJson, API_NO_CACHE_HEADERS } from "@/lib/api/client";
import type { EnsureSellersByAreaResponse } from "@/lib/sellersByArea/types";

export type { EnsureSellersByAreaResponse };

export async function ensureSellersByAreaCatalog() {
  const res = await fetch("/api/sellers-by-area/ensure", {
    method: "POST",
    cache: "no-store",
    headers: API_NO_CACHE_HEADERS,
  });
  return parseProxyJson<EnsureSellersByAreaResponse>(
    res,
    "Failed to ensure area sellers catalog.",
  );
}
