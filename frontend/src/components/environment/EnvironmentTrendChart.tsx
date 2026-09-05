import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Group, Text } from "@mantine/core";
import type { EnvironmentLogRead, GeckoRead } from "../../api/types";

interface EnvironmentTrendChartProps {
  gecko: GeckoRead;
  /** 由新到舊排序（呼叫端已排序好，這裡只需反轉成由舊到新給圖表用） */
  logs: EnvironmentLogRead[];
}

export function EnvironmentTrendChart({ gecko, logs }: EnvironmentTrendChartProps) {
  const points = [...logs]
    .reverse()
    .map((l) => ({
      recordedAt: l.recorded_at,
      label: new Date(l.recorded_at).toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      temperature: Number(l.temperature),
      humidity: Number(l.humidity),
    }));

  if (points.length < 2) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        記錄兩次以上溫濕度就會畫出趨勢圖。
      </Text>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a2e1e" />
          <XAxis dataKey="label" stroke="#c7b092" fontSize={11} interval="preserveStartEnd" />
          <YAxis yAxisId="temp" stroke="#c98b3a" fontSize={12} unit="°C" width={48} domain={["auto", "auto"]} />
          <YAxis
            yAxisId="humidity"
            orientation="right"
            stroke="#8ba05e"
            fontSize={12}
            unit="%"
            width={48}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ background: "#35251a", border: "1px solid #7c5033", color: "#f2ebdc" }}
            itemStyle={{ color: "#f2ebdc" }}
            labelStyle={{ color: "#f2ebdc" }}
            labelFormatter={(l: string) => l}
            formatter={(v: number, name: string) => [name === "temperature" ? `${v}°C` : `${v}%`, name === "temperature" ? "溫度" : "濕度"]}
          />
          {gecko.safe_temp_min != null && (
            <ReferenceLine yAxisId="temp" y={gecko.safe_temp_min} stroke="#c05a45" strokeDasharray="4 4" />
          )}
          {gecko.safe_temp_max != null && (
            <ReferenceLine yAxisId="temp" y={gecko.safe_temp_max} stroke="#c05a45" strokeDasharray="4 4" />
          )}
          {gecko.safe_humidity_min != null && (
            <ReferenceLine yAxisId="humidity" y={gecko.safe_humidity_min} stroke="#5a7a3a" strokeDasharray="4 4" />
          )}
          {gecko.safe_humidity_max != null && (
            <ReferenceLine yAxisId="humidity" y={gecko.safe_humidity_max} stroke="#5a7a3a" strokeDasharray="4 4" />
          )}
          <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#c98b3a" strokeWidth={2} dot={false} />
          <Line yAxisId="humidity" type="monotone" dataKey="humidity" stroke="#8ba05e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <Group gap="md" mt={4}>
        <Group gap={4}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#c98b3a" }} />
          <Text size="xs" c="dimmed">
            溫度
          </Text>
        </Group>
        <Group gap={4}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#8ba05e" }} />
          <Text size="xs" c="dimmed">
            濕度
          </Text>
        </Group>
      </Group>
    </div>
  );
}
