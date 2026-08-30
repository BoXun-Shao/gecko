import type { DailyLogRead } from "../api/types";
import { toDate, toDateStr } from "./dates";

export type GranularityMode = "day" | "week" | "cycle" | "month" | "year";

export const MODES: { value: GranularityMode; label: string }[] = [
  { value: "day", label: "天" },
  { value: "week", label: "週" },
  { value: "cycle", label: "餵食週期" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
];

export const MODE_TITLE: Record<GranularityMode, string> = {
  day: "近 30 天",
  week: "近 12 週",
  cycle: "近 12 個餵食週期",
  month: "近 12 個月",
  year: "近 6 年",
};

export const MODE_UNIT: Record<GranularityMode, string> = {
  day: "天",
  week: "週",
  cycle: "週期",
  month: "月",
  year: "年",
};

export interface Bucket {
  start: string;
  end: string;
  label: string;
  qty: number;
  fed: number;
  refused: number;
  skip: number;
  poop: number;
}

function makeBucket(start: Date, end: Date, label: string): Bucket {
  return { start: toDateStr(start), end: toDateStr(end), label, qty: 0, fed: 0, refused: 0, skip: 0, poop: 0 };
}

export function buildBuckets(mode: GranularityMode, today: string, intervalDays: number): Bucket[] {
  const t = toDate(today);
  const out: Bucket[] = [];

  if (mode === "day") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      out.push(makeBucket(d, d, toDateStr(d).slice(5).replace("-", "/")));
    }
  } else if (mode === "cycle") {
    for (let i = 11; i >= 0; i--) {
      const e = new Date(t);
      e.setDate(e.getDate() - i * intervalDays);
      const s = new Date(e);
      s.setDate(s.getDate() - intervalDays + 1);
      out.push(makeBucket(s, e, toDateStr(s).slice(5).replace("-", "/")));
    }
  } else if (mode === "month") {
    for (let i = 11; i >= 0; i--) {
      const s = new Date(t.getFullYear(), t.getMonth() - i, 1);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
      out.push(makeBucket(s, e, `${s.getMonth() + 1}月`));
    }
  } else if (mode === "year") {
    for (let i = 5; i >= 0; i--) {
      const y = t.getFullYear() - i;
      out.push(makeBucket(new Date(y, 0, 1), new Date(y, 11, 31), String(y)));
    }
  } else {
    const end = new Date(t);
    end.setDate(end.getDate() - ((end.getDay() + 6) % 7));
    for (let i = 11; i >= 0; i--) {
      const s = new Date(end);
      s.setDate(s.getDate() - i * 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      out.push(makeBucket(s, e, toDateStr(s).slice(5).replace("-", "/")));
    }
  }
  return out;
}

export function fillBuckets(buckets: Bucket[], logs: DailyLogRead[]): Bucket[] {
  logs.forEach((l) => {
    const b = buckets.find((b) => l.date >= b.start && l.date <= b.end);
    if (!b) return;
    b.qty += Number(l.qty ?? 0);
    if (Number(l.qty ?? 0) > 0) b.fed++;
    else if (l.status === "skipped") b.skip++;
    else b.refused++;
    if (l.poop) b.poop++;
  });
  return buckets;
}
