import type { SearchCustomerTelsData } from "@/types/wc";
import type { SearchCustomerTelsSuccess } from "@/types/api/responses";
import { isApiFailure } from "@/lib/api/client";

const cache = new Map<string, SearchCustomerTelsData | null>();

function cacheKey(customer_GID: string, customerAMKA: string) {
  return `${customer_GID}\0${customerAMKA}`;
}

function isSuccessPayload(json: SearchCustomerTelsSuccess): boolean {
  const sc = json.statusCode ?? undefined;
  return sc === undefined || sc === 0 || sc === 200;
}

/**
 * Loads customer phones/emails from `/api/search-customer-tels` (deduped per session).
 */
export async function fetchCustomerTelsCached(
  customer_GID: string,
  customerAMKA: string,
): Promise<SearchCustomerTelsData | null> {
  const gid = customer_GID.trim();
  const amka = customerAMKA.trim();
  const key = cacheKey(gid, amka);
  if (cache.has(key)) return cache.get(key)!;

  const params = new URLSearchParams();
  if (gid) params.set("customer_GID", gid);
  if (amka) params.set("customerAMKA", amka);

  const p = (async () => {
    const res = await fetch(`/api/search-customer-tels?${params.toString()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    const json = (await res
      .json()
      .catch(() => ({}))) as SearchCustomerTelsSuccess;
    if (!res.ok || isApiFailure(json)) {
      return null;
    }
    if (!isSuccessPayload(json)) {
      return null;
    }
    const data = json.data;
    if (!data?.customerAMKA && !data?.customerGID) return null;
    return {
      customerAMKA: data.customerAMKA ?? "",
      customerGID: data.customerGID ?? "",
      customerName: data.customerName ?? "",
      telephones: (data.telephones ?? []).map((t) => ({
        name: t.name ?? "",
        phone: t.phone ?? "",
        isFromCustomer: t.isFromCustomer,
      })),
      emails: data.emails ?? [],
    };
  })();

  const result = await p;
  cache.set(key, result);
  return result;
}
