export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function daysBetween(fromDateStr: string, targetDateStr: string): number {
  return Math.round((toDate(targetDateStr).getTime() - toDate(fromDateStr).getTime()) / 86400000);
}
