import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Text } from "@mantine/core";
import type { EggLogRead } from "../../api/types";
import { aggregateEggCounts } from "../../utils/eggStats";

interface EggCountChartProps {
  logs: EggLogRead[];
}

export function EggCountChart({ logs }: EggCountChartProps) {
  const points = aggregateEggCounts(logs);

  if (points.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        還沒有下蛋紀錄，記錄後這裡會畫出每次下蛋數量的走勢。
      </Text>
    );
  }

  const total = points.reduce((s, p) => s + p.eggCount, 0);

  return (
    <div>
      <Text size="sm" c="dimmed" mb={4}>
        累計 {total} 顆蛋
      </Text>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a2e1e" />
          <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} stroke="#c7b092" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#c7b092" fontSize={12} width={32} />
          <Tooltip
            contentStyle={{ background: "#35251a", border: "1px solid #7c5033", color: "#f2ebdc" }}
            itemStyle={{ color: "#f2ebdc" }}
            labelStyle={{ color: "#f2ebdc" }}
            labelFormatter={(d: string) => d}
            formatter={(v: number) => [`${v} 顆`, "蛋數"]}
          />
          <Bar dataKey="eggCount" fill="#c98b3a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
