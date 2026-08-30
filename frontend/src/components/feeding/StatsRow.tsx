import { SimpleGrid, Paper, Text } from "@mantine/core";
import type { DailyLogRead } from "../../api/types";
import { daysBetween, todayStr } from "../../utils/dates";
import { wasFed } from "../../utils/feedingBand";

interface StatTileProps {
  value: string | number;
  label: string;
  alert?: boolean;
}

function StatTile({ value, label, alert }: StatTileProps) {
  return (
    <Paper withBorder p="sm" radius="md" style={{ textAlign: "center" }}>
      <Text fw={700} size="lg" c={alert ? "red" : undefined}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
}

interface StatsRowProps {
  logs: DailyLogRead[];
  intervalDays: number;
}

export function StatsRow({ logs, intervalDays }: StatsRowProps) {
  const today = todayStr();
  const lastFed = logs.find(wasFed);
  const lastPoop = logs.find((l) => l.poop);
  const month = today.slice(0, 7);
  const monthQty = logs.filter((l) => l.date.startsWith(month)).reduce((s, l) => s + Number(l.qty ?? 0), 0);
  const fastDays = lastFed ? daysBetween(lastFed.date, today) : null;
  const poopDays = lastPoop ? daysBetween(lastPoop.date, today) : null;

  let nextText = "—";
  let nextAlert = false;
  if (lastFed) {
    const due = daysBetween(lastFed.date, today) - intervalDays;
    if (due === 0) nextText = "今天";
    else if (due > 0) {
      nextText = `逾期 ${due} 天`;
      nextAlert = due >= intervalDays;
    } else nextText = `${-due} 天後`;
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
      <StatTile value={logs.length} label="紀錄筆數" />
      <StatTile value={monthQty} label="本月進食總量" />
      <StatTile
        value={fastDays === null ? "—" : fastDays}
        label="距上次進食（天）"
        alert={fastDays !== null && fastDays >= intervalDays * 2}
      />
      <StatTile value={nextText} label={`下次餵食（每 ${intervalDays} 天）`} alert={nextAlert} />
      <StatTile
        value={poopDays === null ? "—" : poopDays}
        label="距上次排便（天）"
        alert={poopDays !== null && poopDays >= intervalDays + 3}
      />
    </SimpleGrid>
  );
}
