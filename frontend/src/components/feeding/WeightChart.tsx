import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Text } from "@mantine/core";
import type { DailyLogRead } from "../../api/types";

interface WeightChartProps {
  logs: DailyLogRead[];
}

export function WeightChart({ logs }: WeightChartProps) {
  const points = logs
    .filter((l) => l.weight != null)
    .map((l) => ({ date: l.date, weight: Number(l.weight) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (points.length < 2) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        記錄兩次以上體重就會畫出成長曲線。肥尾守宮的體重變化比進食量更能反映狀態，建議每 1–2 週固定量一次。
      </Text>
    );
  }

  const last = points[points.length - 1];
  const delta = +(last.weight - points[points.length - 2].weight).toFixed(1);

  return (
    <div>
      <Text size="sm" c={delta > 0 ? "green" : delta < 0 ? "red" : "dimmed"} mb={4}>
        {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : `● ${delta}`} g（與前次相比）
      </Text>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c98b3a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#c98b3a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a2e1e" />
          <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} stroke="#c7b092" fontSize={12} />
          <YAxis domain={["auto", "auto"]} stroke="#c7b092" fontSize={12} unit="g" width={48} />
          <Tooltip
            contentStyle={{ background: "#35251a", border: "1px solid #7c5033", color: "#f2ebdc" }}
            itemStyle={{ color: "#f2ebdc" }}
            labelStyle={{ color: "#f2ebdc" }}
            labelFormatter={(d: string) => d}
            formatter={(v: number) => [`${v} g`, "體重"]}
          />
          <Area type="monotone" dataKey="weight" stroke="#c98b3a" strokeWidth={2} fill="url(#weightFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
