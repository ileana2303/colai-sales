import type { wcCalendar } from "@/types/wc";
import {
  formatElGRDateLong,
  formatElGRMonthYear,
  parseOrderDate,
} from "@/lib/utils/date";

export { parseOrderDate } from "@/lib/utils/date";

export type WcDayGroup = {
  dayOfMonth: number;
  dayTitle: string;
  items: wcCalendar[];
  totalTurnover: number;
};

export type WcMonthGroup = {
  sortKey: number;
  monthTitle: string;
  ordersCount: number;
  totalTurnover: number;
  days: WcDayGroup[];
};

function turnoverEuros(r: wcCalendar): number {
  const v = r.totalTurnover;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

export type WcCalendarGroupOrder = {
  /** Order of month buckets (default: newest month first). */
  monthOrder?: "asc" | "desc";
  /** Order of days within each month (default: higher day number first). */
  dayOrder?: "asc" | "desc";
};

export function groupWcCalendarByLastOrderDate(
  items: wcCalendar[],
  order: WcCalendarGroupOrder = {},
): WcMonthGroup[] {
  const monthOrder = order.monthOrder ?? "desc";
  const dayOrder = order.dayOrder ?? "desc";
  type Entry = { r: wcCalendar; d: Date };
  const dated: Entry[] = [];

  for (const r of items) {
    const d = parseOrderDate(r.expectedNextOrderDate);
    if (d) dated.push({ r, d });
  }

  const byMonth = new Map<number, Entry[]>();
  for (const e of dated) {
    const y = e.d.getFullYear();
    const m = e.d.getMonth() + 1;
    const key = y * 100 + m;
    const arr = byMonth.get(key);
    if (arr) arr.push(e);
    else byMonth.set(key, [e]);
  }

  const monthKeys = [...byMonth.keys()].sort((a, b) =>
    monthOrder === "desc" ? b - a : a - b,
  );

  return monthKeys.map((monthKey) => {
    const year = Math.floor(monthKey / 100);
    const month = monthKey % 100;
    const entries = byMonth.get(monthKey)!;

    const ordersCount = entries.length;
    const totalTurnover = entries.reduce(
      (sum, { r }) => sum + turnoverEuros(r),
      0,
    );

    const byDay = new Map<number, wcCalendar[]>();
    for (const { r, d } of entries) {
      const dom = d.getDate();
      const list = byDay.get(dom);
      if (list) list.push(r);
      else byDay.set(dom, [r]);
    }

    const dayNumbers = [...byDay.keys()].sort((a, b) =>
      dayOrder === "desc" ? b - a : a - b,
    );
    const days: WcDayGroup[] = dayNumbers.map((dayOfMonth) => {
      const sample = entries.find((e) => e.d.getDate() === dayOfMonth)!.d;
      const dayItems = byDay.get(dayOfMonth)!;
      const dayTurnover = dayItems.reduce(
        (sum, r) => sum + turnoverEuros(r),
        0,
      );
      return {
        dayOfMonth,
        dayTitle: formatElGRDateLong(sample),
        items: dayItems,
        totalTurnover: dayTurnover,
      };
    });

    const monthTitle = formatElGRMonthYear(new Date(year, month - 1, 1));

    return {
      sortKey: monthKey,
      monthTitle,
      ordersCount,
      totalTurnover,
      days,
    };
  });
}
