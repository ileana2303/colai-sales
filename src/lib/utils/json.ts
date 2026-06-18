export function getObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function getArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

export function parseJsonText(text: string): unknown {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
