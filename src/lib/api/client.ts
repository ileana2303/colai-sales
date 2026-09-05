import type { ApiFailure } from "@/types/api";

export const API_NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

export function isApiFailure(data: unknown): data is ApiFailure {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as ApiFailure).ok === false
  );
}

/**
 * Single error-message extractor for app `{ message }`, FastAPI `{ detail }`,
 * and OpenAI-shaped `{ error: { message } }` payloads.
 */
export function getApiErrorMessage(
  data: unknown,
  fallback = "Request failed",
): string {
  if (typeof data !== "object" || data === null) {
    return fallback;
  }

  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message.trim();

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (
      typeof first === "object" &&
      first !== null &&
      typeof (first as { msg?: unknown }).msg === "string"
    ) {
      return String((first as { msg: string }).msg).trim();
    }
  }

  const error = (data as { error?: unknown }).error;
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return String((error as { message: string }).message).trim();
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
