import { ActionIcon, Group, Table, Text } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { EggLogRead } from "../../api/types";
import { useDeleteEggLog } from "../../hooks/useEggLogs";

interface EggLogHistoryListProps {
  geckoId: string;
  geckoName: string;
  logs: EggLogRead[];
  onEdit: (id: string) => void;
}

export function EggLogHistoryList({ geckoId, geckoName, logs, onEdit }: EggLogHistoryListProps) {
  const deleteLog = useDeleteEggLog(geckoId);

  if (!logs.length) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        {geckoName} 還沒有下蛋紀錄。用上面的表單記下這次下蛋。
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

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>日期</Table.Th>
            <Table.Th>蛋數</Table.Th>
            <Table.Th>備註</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {logs.map((l) => (
            <Table.Tr key={l.id}>
              <Table.Td>{l.date}</Table.Td>
              <Table.Td>{l.egg_count}</Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {l.note || "—"}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon variant="subtle" color="clay" onClick={() => onEdit(l.id)} aria-label="編輯">
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(l.id, l.date)} aria-label="刪除">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
