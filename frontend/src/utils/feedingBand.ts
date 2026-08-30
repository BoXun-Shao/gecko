import type { DailyLogRead } from "../api/types";
import { daysBetween, toDate, toDateStr } from "./dates";

export type BandCellStatus = "fed" | "refused" | "skip" | "due" | "off";

export interface BandCell {
  date: string;
  status: BandCellStatus;
  poop: boolean;
  tooltip: string;
}

export function wasFed(log: DailyLogRead): boolean {
  return (log.status === "fed" || log.status === "partial") && Number(log.qty ?? 0) > 0;
}

function lastFedBefore(logs: DailyLogRead[], dateStr: string): DailyLogRead | undefined {
  return logs
    .filter((l) => l.date < dateStr && wasFed(l))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function isDueDay(logs: DailyLogRead[], intervalDays: number, dateStr: string): boolean {
  const last = lastFedBefore(logs, dateStr);
  return last ? daysBetween(last.date, dateStr) >= intervalDays : true;
}

export function computeFeedingBand(logs: DailyLogRead[], today: string, intervalDays: number): BandCell[] {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const dates: string[] = [];
  for (let i = 59; i >= 0; i--) {
    const d = toDate(today);
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }

  let lastFed = lastFedBefore(logs, dates[0])?.date ?? null;

  return dates.map((ds) => {
    const l = byDate.get(ds);
    let status: BandCellStatus;
    let tooltip: string;

    if (l && wasFed(l)) {
      status = "fed";
      tooltip = `${ds}　${l.food || "餌料"}${l.food_size ? `（${l.food_size}）` : ""} × ${l.qty}`;
      lastFed = ds;
    } else if (l && l.status === "skipped") {
      status = "skip";
      tooltip = `${ds}　沒餵（非餵食日）`;
    } else if (l) {
      status = "refused";
      tooltip = `${ds}　拒食`;
    } else {
      const due = lastFed ? daysBetween(lastFed, ds) >= intervalDays : false;
      status = due ? "due" : "off";
      tooltip = due ? `${ds}　排定餵食日，尚無紀錄` : `${ds}　非餵食日`;
    }

    if (l?.poop) tooltip += "　排便 ✓";
    return { date: ds, status, poop: !!l?.poop, tooltip };
  });
}
