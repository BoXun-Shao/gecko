import { ActionIcon, Group, Image, Table, Text } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { assetUrl } from "../../api/client";
import type { SheddingLogRead } from "../../api/types";
import { useDeleteSheddingLog } from "../../hooks/useSheddingLogs";

interface SheddingLogHistoryListProps {
  geckoId: string;
  geckoName: string;
  logs: SheddingLogRead[];
  onEdit: (id: string) => void;
}

export function SheddingLogHistoryList({ geckoId, geckoName, logs, onEdit }: SheddingLogHistoryListProps) {
  const deleteLog = useDeleteSheddingLog(geckoId);

  if (!logs.length) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        {geckoName} 還沒有蛻皮紀錄。用上面的表單記下這次蛻皮。
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
            <Table.Th>備註</Table.Th>
            <Table.Th>照片</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {logs.map((l) => (
            <Table.Tr key={l.id}>
              <Table.Td>{l.date}</Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {l.note || "—"}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  {l.photos.slice(0, 3).map((p) => (
                    <Image key={p.id} src={assetUrl(p.file_path)} w={32} h={32} radius="sm" fit="cover" />
                  ))}
                  {l.photos.length > 3 && (
                    <Text size="xs" c="dimmed">
                      +{l.photos.length - 3}
                    </Text>
                  )}
                  {l.photos.length === 0 && (
                    <Text size="xs" c="dimmed">
                      無
                    </Text>
                  )}
                </Group>
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
