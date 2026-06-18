import { getArray, getObject, parseJsonText } from "@/lib/utils/json";

export const WC_SQL_NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
} as const;

function countReplacementChars(text: string): number {
  return (text.match(/\uFFFD/g) ?? []).length;
}

export function decodeResponseText(
  buffer: ArrayBuffer,
  contentType: string | null,
): string {
  const charset = contentType?.match(/charset=([^;\s]+)/i)?.[1]?.trim();
  if (charset) {
    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      // Fall through to UTF-8 with Windows-1253 fallback.
    }
  }

  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;

  try {
    const windows1253 = new TextDecoder("windows-1253").decode(buffer);
    return countReplacementChars(windows1253) < countReplacementChars(utf8)
      ? windows1253
      : utf8;
  } catch {
    return utf8;
  }
}

export function extractSqlRecords<T>(payload: unknown): T[] {
  const body = getObject(payload);
  const data = getObject(body?.data);

  return (
    getArray<T>(body?.rows) ??
    getArray<T>(body?.items) ??
    getArray<T>(body?.result) ??
    getArray<T>(body?.data) ??
    getArray<T>(data?.mydata) ??
    getArray<T>(data?.rows) ??
    getArray<T>(data?.items) ??
    getArray<T>(data?.result) ??
    []
  );
}

export function getUpstreamErrorMessage(payload: unknown): string | null {
  const body = getObject(payload);
  if (!body) return null;

  const success = body.success;
  if (success === false || success === "false") {
    return String(body.error ?? body.message ?? "SQL data service failed");
  }

  const statusCode = Number(body.statusCode);
  if (Number.isFinite(statusCode) && statusCode !== 0 && statusCode !== 200) {
    return String(
      body.message ?? body.detailedMessage ?? "SQL data service failed",
    );
  }

  return null;
}

export async function readSqlUpstreamPayload(
  upstream: Response,
): Promise<{ payload: unknown; text: string }> {
  const text = await upstream
    .arrayBuffer()
    .then((buffer) =>
      decodeResponseText(buffer, upstream.headers.get("content-type")),
    )
    .catch(() => "");
  const payload = parseJsonText(text);

  return { payload, text };
}
