export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function readRowValue(
  row: Record<string, unknown>,
  key: string,
): unknown {
  return row[`[${key}]`] ?? row[key];
}

export function readString(row: Record<string, unknown>, key: string): string {
  return String(readRowValue(row, key) ?? "").trim();
}

export function readNullableString(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const value = readRowValue(row, key);
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function readNumber(
  row: Record<string, unknown>,
  key: string,
): number | null {
  return toNullableNumber(readRowValue(row, key));
}

export function readOptionalString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = readString(row, key);
  return value || undefined;
}
