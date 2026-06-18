import type { Maybe } from "@/types/api/common";

export type DateFormatStyle = "date" | "datetime";

const elGrDateShort = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const elGrDateTime = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const elGrDateLong = new Intl.DateTimeFormat("el-GR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const elGrMonthYear = new Intl.DateTimeFormat("el-GR", {
  month: "long",
  year: "numeric",
});

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Parses ISO-like date/time as local components (avoids UTC day-shift on date-only strings).
 */
export function parseLocalDateTime(value: Maybe<string>): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/,
  );
  if (match) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseLocalDateTimeMs(value: Maybe<string>): number {
  const date = parseLocalDateTime(value);
  return date ? date.getTime() : 0;
}

/**
 * Parses a date string as a local calendar date when possible (avoids UTC day-shift on date-only strings).
 * ISO datetimes (`2026-03-25T19:51:53.074Z`) use the calendar portion in local time.
 */
export function parseOrderDate(value: Maybe<string>): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).trim();
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoDay) {
    const y = Number(isoDay[1]);
    const m = Number(isoDay[2]);
    const d = Number(isoDay[3]);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatElGRDateShort(
  value: Maybe<string>,
  fallback = "-",
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const date = parseLocalDateTime(raw);
  if (!date) return raw;

  return elGrDateShort.format(date);
}

export function formatElGRDateTime(
  value: Maybe<string>,
  fallback = "-",
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const date = parseLocalDateTime(raw) ?? new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return elGrDateTime.format(date);
}

export function formatElGRDateLong(value: Date): string {
  return elGrDateLong.format(value);
}

export function formatElGRMonthYear(value: Date): string {
  return elGrMonthYear.format(value);
}

/**
 * Formats a date-like value to UI-friendly string (default: dd/mm/yyyy).
 * Accepts: ISO string, "2026-01-31", Date, timestamp, null/undefined.
 */
export function formatUIDate(
  value: Maybe<string | number | Date>,
  style: DateFormatStyle = "date",
): string {
  if (value == null || value === "") return "";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();

  if (style === "date") return `${dd}/${mm}/${yyyy}`;

  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function formatCompactUIDateTime(
  value: Maybe<string | number | Date>,
): string {
  if (value == null || value === "") return "";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  const time = `${hh}:${min}`;

  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  if (isToday) return time;

  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  return `${dd}/${mm} ${time}`;
}

export function formatStringToISODDateTime(value: string): string | null {
  if (value == null || value === "") return null;

  const [dd, mm, yyyy] = value.split("/").map(Number);

  const now = new Date();
  const dt = new Date(
    yyyy,
    mm - 1,
    dd,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );

  const iso = dt.toISOString();

  return iso;
}
