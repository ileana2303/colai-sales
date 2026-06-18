import type { ApiFailure } from "@/types/api";

export function isApiFailure(data: unknown): data is ApiFailure {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as ApiFailure).ok === false
  );
}

export function getApiErrorMessage(
  data: unknown,
  fallback = "Request failed",
): string {
  if (typeof data === "object" && data !== null) {
    const msg = (data as ApiFailure).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return fallback;
}

/** Parse JSON from a Next.js proxy response that uses `{ ok: true | false }`. */
export async function parseProxyJson<T>(
  res: Response,
  fallbackError = "Request failed",
): Promise<T> {
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok || isApiFailure(data)) {
    throw new Error(getApiErrorMessage(data, fallbackError));
  }
  return data as T;
}

/** Parse JSON without requiring an `ok` wrapper (e.g. run-ai, search-erp-contacts). */
export async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}
