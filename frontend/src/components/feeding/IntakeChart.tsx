import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Group, SegmentedControl, Stack, Text } from "@mantine/core";
import type { DailyLogRead } from "../../api/types";
import { buildBuckets, fillBuckets, MODE_TITLE, MODE_UNIT, MODES, type Bucket } from "../../utils/feedingBuckets";
import { todayStr } from "../../utils/dates";

function barColor(b: Bucket): string {
  if (b.qty > 0) return "#c98b3a";
  if (b.refused > 0) return "#c05a45";
  if (b.skip > 0) return "#6b442c";
  return "transparent";
}

interface IntakeChartProps {
  logs: DailyLogRead[];
  intervalDays: number;
}

export function IntakeChart({ logs, intervalDays }: IntakeChartProps) {
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("week");

  const buckets = useMemo(
    () => fillBuckets(buildBuckets(mode, todayStr(), intervalDays), logs),
    [logs, mode, intervalDays],
  );

  const hasData = buckets.some((b) => b.fed || b.refused || b.skip);
  const total = buckets.reduce((s, b) => s + b.qty, 0);
  const activeCount = buckets.filter((b) => b.fed || b.refused || b.skip).length;
  const avg = activeCount ? (total / activeCount).toFixed(1) : "0";

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="wrap">
        <Text fw={600}>進食量 · {MODE_TITLE[mode]}</Text>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={(v) => setMode(v as (typeof MODES)[number]["value"])}
          data={MODES.map((m) => ({ value: m.value, label: m.value === "cycle" ? `每 ${intervalDays} 天` : m.label }))}
        />
      </Group>

      {!hasData ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          {MODE_TITLE[mode]}還沒有紀錄。
        </Text>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={buckets} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#a89279" fontSize={11} interval="preserveStartEnd" />
              <Tooltip
                contentStyle={{ background: "#2b1e17", border: "1px solid #4a2e1e", color: "#f2ebdc" }}
                formatter={(_: number, __: string, item) => {
                  const b = item.payload as Bucket;
                  return [`共 ${b.qty} 隻／進食 ${b.fed}、拒食 ${b.refused}、沒餵 ${b.skip}、排便 ${b.poop}`, ""];
                }}
              />
              <Bar dataKey="qty" radius={[2, 2, 0, 0]} minPointSize={2}>
                {buckets.map((b, i) => (
                  <Cell key={i} fill={barColor(b)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Group gap="md">
            <Group gap={4}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#c98b3a" }} />
              <Text size="xs" c="dimmed">
                進食總量（隻）
              </Text>
            </Group>
            <Group gap={4}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#c05a45" }} />
              <Text size="xs" c="dimmed">
                該區間全拒食
              </Text>
            </Group>
            <Group gap={4}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#6b442c" }} />
              <Text size="xs" c="dimmed">
                該區間全沒餵
              </Text>
            </Group>
            <Text size="xs" c="orange">
              合計 {total} 隻・平均每{MODE_UNIT[mode]} {avg} 隻
            </Text>
          </Group>
        </>
      )}
    </Stack>
  );
}
