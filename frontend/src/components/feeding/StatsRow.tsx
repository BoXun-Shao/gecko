import { SimpleGrid, Paper, Text } from "@mantine/core";
import { IconBowl, IconCalendar, IconClock, IconDroplet, IconMeat } from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import type { DailyLogRead } from "../../api/types";
import { daysBetween, todayStr } from "../../utils/dates";
import { wasFed } from "../../utils/feedingBand";

interface StatTileProps {
  icon: Icon;
  value: string | number;
  label: string;
  alert?: boolean;
  highlight?: boolean;
}

function StatTile({ icon: TileIcon, value, label, alert, highlight }: StatTileProps) {
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        textAlign: "center",
        backgroundColor: highlight ? "#3a2716" : undefined,
        borderColor: highlight ? "#7c5033" : undefined,
      }}
    >
      <TileIcon size={16} color={highlight ? "#e8d5a9" : "#a8886a"} stroke={1.8} style={{ marginBottom: 6 }} />
      <Text fw={700} size="lg" c={alert ? "red" : highlight ? "sand" : undefined}>
        {value}
      </Text>
      <Text size="xs" c={highlight ? undefined : "dimmed"} style={highlight ? { color: "#d9c3a3" } : undefined}>
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
      <StatTile icon={IconCalendar} value={logs.length} label="紀錄筆數" />
      <StatTile icon={IconMeat} value={monthQty} label="本月進食總量" />
      <StatTile
        icon={IconClock}
        value={fastDays === null ? "—" : fastDays}
        label="距上次進食（天）"
        alert={fastDays !== null && fastDays >= intervalDays * 2}
      />
      <StatTile
        icon={IconBowl}
        value={nextText}
        label={`下次餵食（每 ${intervalDays} 天）`}
        alert={nextAlert}
        highlight={!nextAlert}
      />
      <StatTile
        icon={IconDroplet}
        value={poopDays === null ? "—" : poopDays}
        label="距上次排便（天）"
        alert={poopDays !== null && poopDays >= intervalDays + 3}
      />
    </SimpleGrid>
  );
}
