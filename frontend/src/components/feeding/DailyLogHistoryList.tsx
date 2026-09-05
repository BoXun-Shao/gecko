import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { DailyLogRead } from "../../api/types";
import { useDeleteDailyLog } from "../../hooks/useDailyLogs";
import type { DateJump } from "./DailyLogForm";

const STATUS_BADGE: Record<DailyLogRead["status"], { label: string; color: string }> = {
  fed: { label: "已餵食", color: "clay" },
  partial: { label: "部分進食", color: "yellow" },
  refused: { label: "拒食", color: "red" },
  skipped: { label: "沒餵", color: "gray" },
};

interface DailyLogHistoryListProps {
  geckoId: string;
  geckoName: string;
  logs: DailyLogRead[];
  onEdit: (jump: DateJump) => void;
  /** When set, caps the visible height to roughly this many rows and makes the list scroll internally. */
  maxVisibleRows?: number;
}

const ROW_HEIGHT_PX = 45;
const HEADER_HEIGHT_PX = 45;

export function DailyLogHistoryList({ geckoId, geckoName, logs, onEdit, maxVisibleRows }: DailyLogHistoryListProps) {
  const deleteLog = useDeleteDailyLog(geckoId);

  if (!logs.length) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        {geckoName} 還沒有紀錄。用上面的表單記下今天的餵食。
      </Text>
    );
  }

  async function handleDelete(id: string, date: string) {
    if (!window.confirm("刪除這筆紀錄？")) return;
    try {
      await deleteLog.mutateAsync(id);
      notifications.show({ message: `已刪除 ${date}`, color: "green" });
    } catch {
      notifications.show({ message: "刪除失敗，請再試一次", color: "red" });
    }
  }

  const scrollHeight =
    maxVisibleRows && logs.length > maxVisibleRows
      ? HEADER_HEIGHT_PX + maxVisibleRows * ROW_HEIGHT_PX
      : undefined;

  return (
    <Table.ScrollContainer minWidth={600} maxHeight={scrollHeight}>
      <Table verticalSpacing="xs" stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>日期</Table.Th>
            <Table.Th>餌料</Table.Th>
            <Table.Th>數量</Table.Th>
            <Table.Th>排便</Table.Th>
            <Table.Th>體重</Table.Th>
            <Table.Th>備註</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {logs.map((l) => {
            const badge = STATUS_BADGE[l.status];
            return (
              <Table.Tr key={l.id}>
                <Table.Td>{l.date}</Table.Td>
                <Table.Td>
                  {l.food || "—"}
                  {l.food_size && (
                    <Text span size="xs" c="dimmed" ml={4}>
                      {l.food_size}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {Number(l.qty ?? 0) > 0 ? l.qty : <Badge color={badge.color}>{badge.label}</Badge>}
                </Table.Td>
                <Table.Td>{l.poop ? <Badge color="green">有</Badge> : <Text c="dimmed">無</Text>}</Table.Td>
                <Table.Td>{l.weight != null ? `${l.weight} g` : "—"}</Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {l.note}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="clay"
                      onClick={() => onEdit({ date: l.date, nonce: Date.now() })}
                      aria-label="編輯"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(l.id, l.date)} aria-label="刪除">
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
