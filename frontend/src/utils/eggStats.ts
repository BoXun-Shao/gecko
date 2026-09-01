import type { EggLogRead } from "../api/types";

export interface EggChartPoint {
  date: string;
  eggCount: number;
}

/** 依日期加總蛋數（同一天可能有多筆紀錄），並依日期由舊到新排序。 */
export function aggregateEggCounts(logs: EggLogRead[]): EggChartPoint[] {
  const totals = new Map<string, number>();
  for (const l of logs) {
    totals.set(l.date, (totals.get(l.date) ?? 0) + l.egg_count);
  }
  return [...totals.entries()]
    .map(([date, eggCount]) => ({ date, eggCount }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
