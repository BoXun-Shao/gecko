import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core";
import { IconAlertTriangle, IconPencil, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { EnvironmentLogRead, GeckoRead } from "../../api/types";
import { useDeleteEnvironmentLog } from "../../hooks/useEnvironmentLogs";
import { isOutOfRange } from "../../utils/environment";

const SOURCE_LABEL: Record<EnvironmentLogRead["source"], string> = {
  manual: "手動",
  sensor: "感測器",
};

interface EnvironmentLogHistoryListProps {
  gecko: GeckoRead;
  logs: EnvironmentLogRead[];
  onEdit: (id: string) => void;
}

export function EnvironmentLogHistoryList({ gecko, logs, onEdit }: EnvironmentLogHistoryListProps) {
  const deleteLog = useDeleteEnvironmentLog(gecko.id);

  if (!logs.length) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        {gecko.name} 還沒有環境紀錄。用上面的表單記下這次溫濕度。
      </Text>
    );
  }

  async function handleDelete(id: string) {
    if (!window.confirm("刪除這筆紀錄？")) return;
    try {
      await deleteLog.mutateAsync(id);
      notifications.show({ message: "已刪除", color: "green" });
    } catch {
      notifications.show({ message: "刪除失敗，請再試一次", color: "red" });
    }
  }

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>量測時間</Table.Th>
            <Table.Th>溫度</Table.Th>
            <Table.Th>濕度</Table.Th>
            <Table.Th>來源</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {logs.map((l) => {
            const temp = Number(l.temperature);
            const humidity = Number(l.humidity);
            const tempAlert = isOutOfRange(temp, gecko.safe_temp_min, gecko.safe_temp_max);
            const humidityAlert = isOutOfRange(humidity, gecko.safe_humidity_min, gecko.safe_humidity_max);
            return (
              <Table.Tr key={l.id}>
                <Table.Td>{new Date(l.recorded_at).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap={5} wrap="nowrap">
                    {tempAlert && <IconAlertTriangle size={13} color="#d9846f" />}
                    <Text c={tempAlert ? "red" : undefined} fw={tempAlert ? 700 : undefined}>
                      {temp}°C
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={5} wrap="nowrap">
                    {humidityAlert && <IconAlertTriangle size={13} color="#d9846f" />}
                    <Text c={humidityAlert ? "red" : undefined} fw={humidityAlert ? 700 : undefined}>
                      {humidity}%
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="clay">
                    {SOURCE_LABEL[l.source]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon variant="subtle" color="clay" onClick={() => onEdit(l.id)} aria-label="編輯">
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(l.id)} aria-label="刪除">
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
