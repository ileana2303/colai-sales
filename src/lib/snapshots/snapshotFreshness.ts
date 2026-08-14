/** A snapshot is reused until it is this many calendar days old. */
export const SNAPSHOT_FRESHNESS_DAYS = 7;

export function isSnapshotFresh(
  snapshotDate: string | null | undefined,
  today: string,
) {
  if (!snapshotDate) return false;

  const snapshotMs = Date.parse(`${snapshotDate}T00:00:00.000Z`);
  const todayMs = Date.parse(`${today}T00:00:00.000Z`);
  if (Number.isNaN(snapshotMs) || Number.isNaN(todayMs)) return false;

  const ageDays = (todayMs - snapshotMs) / 86_400_000;
  return ageDays >= 0 && ageDays < SNAPSHOT_FRESHNESS_DAYS;
}
