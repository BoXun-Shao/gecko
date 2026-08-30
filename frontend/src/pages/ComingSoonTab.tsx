import { Paper, Text } from "@mantine/core";

export function ComingSoonTab({ label }: { label: string }) {
  return (
    <Paper withBorder p="xl" radius="md">
      <Text c="dimmed" ta="center">
        {label}分頁籤即將推出。
      </Text>
    </Paper>
  );
}
