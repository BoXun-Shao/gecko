import type { CSSProperties } from "react";
import { Box, Group, Text } from "@mantine/core";
import type { DailyLogRead } from "../../api/types";
import { computeFeedingBand, type BandCellStatus } from "../../utils/feedingBand";
import { todayStr } from "../../utils/dates";

const CELL_STYLE: Record<BandCellStatus, CSSProperties> = {
  fed: { backgroundColor: "#e8d5a9" },
  refused: { backgroundColor: "#6b442c" },
  skip: { backgroundColor: "#4a2e1e" },
  due: { backgroundColor: "transparent", border: "1px dashed #c98b3a" },
  off: { backgroundColor: "#1c1310", border: "1px solid #4a2e1e" },
};

const LEGEND: { color?: string; border?: string; label: string; dashed?: boolean }[] = [
  { color: "#e8d5a9", label: "有進食" },
  { color: "#6b442c", label: "拒食" },
  { color: "#4a2e1e", label: "沒餵" },
  { border: "1px dashed #c98b3a", label: "排定日未記錄" },
  { color: "#1c1310", border: "1px solid #4a2e1e", label: "非餵食日" },
  { color: "#8ba05e", label: "當天排便" },
];

interface FeedingBandProps {
  logs: DailyLogRead[];
  intervalDays: number;
}

export function FeedingBand({ logs, intervalDays }: FeedingBandProps) {
  const cells = computeFeedingBand(logs, todayStr(), intervalDays);

  return (
    <Box>
      <Group gap={2} wrap="wrap">
        {cells.map((cell) => (
          <Box
            key={cell.date}
            title={cell.tooltip}
            style={{
              position: "relative",
              width: 12,
              height: 22,
              borderRadius: 2,
              ...CELL_STYLE[cell.status],
            }}
          >
            {cell.poop && (
              <Box
                style={{
                  position: "absolute",
                  bottom: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "#8ba05e",
                }}
              />
            )}
          </Box>
        ))}
      </Group>
      <Group gap="md" mt="sm">
        {LEGEND.map((item) => (
          <Group key={item.label} gap={4}>
            <Box
              style={{
                width: 10,
                height: 10,
                borderRadius: item.label === "當天排便" ? "50%" : 2,
                backgroundColor: item.color,
                border: item.border,
              }}
            />
            <Text size="xs" c="dimmed">
              {item.label}
            </Text>
          </Group>
        ))}
      </Group>
    </Box>
  );
}
