import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Group, Stack, Text } from "@mantine/core";
import type { DailyLogRead } from "../../api/types";
import { FOOD_COLORS } from "../../utils/feedingConstants";

interface FoodCompositionChartProps {
  logs: DailyLogRead[];
}

export function FoodCompositionChart({ logs }: FoodCompositionChartProps) {
  const totals = new Map<string, number>();
  logs.forEach((l) => {
    const qty = Number(l.qty ?? 0);
    if (qty <= 0) return;
    const key = (l.food || "未填") + (l.food_size ? ` ${l.food_size}` : "");
    totals.set(key, (totals.get(key) ?? 0) + qty);
  });
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);

  if (!rows.length) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        還沒有進食紀錄，餌料比例會在這裡呈現。
      </Text>
    );
  }

  const total = rows.reduce((s, [, q]) => s + q, 0);
  const data = [Object.fromEntries([["name", "全部"], ...rows])];

  return (
    <Stack gap="sm">
      <ResponsiveContainer width="100%" height={40}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, total]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{ background: "#2b1e17", border: "1px solid #4a2e1e", color: "#f2ebdc" }}
            formatter={(value: number, name: string) => [`${value} 隻（${Math.round((value / total) * 100)}%）`, name]}
          />
          {rows.map(([food], i) => (
            <Bar key={food} dataKey={food} stackId="a" fill={FOOD_COLORS[i % FOOD_COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Group gap="md" wrap="wrap">
        {rows.map(([food, qty], i) => (
          <Group key={food} gap={4}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: FOOD_COLORS[i % FOOD_COLORS.length] }} />
            <Text size="xs" c="dimmed">
              {food} {qty}（{Math.round((qty / total) * 100)}%）
            </Text>
          </Group>
        ))}
      </Group>
    </Stack>
  );
}
