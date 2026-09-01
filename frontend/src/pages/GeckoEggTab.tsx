import { useState } from "react";
import { Grid, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import type { GeckoRead } from "../api/types";
import { useEggLogs } from "../hooks/useEggLogs";
import { EggLogForm } from "../components/egg/EggLogForm";
import { EggLogHistoryList } from "../components/egg/EggLogHistoryList";
import { EggCountChart } from "../components/egg/EggCountChart";

export function GeckoEggTab({ gecko }: { gecko: GeckoRead }) {
  const { data, isLoading, isError } = useEggLogs(gecko.id);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  if (isLoading) return <Loader color="clay" />;
  if (isError) return <Text c="red">下蛋紀錄載入失敗，請重新整理再試。</Text>;

  const logs = [...(data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const editingLog = logs.find((l) => l.id === editingLogId) ?? null;

  return (
    <Stack gap="lg">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <EggLogForm
            geckoId={gecko.id}
            editingLog={editingLog}
            onCreated={(log) => setEditingLogId(log.id)}
            onCancelEdit={() => setEditingLogId(null)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="sm">
              下蛋數走勢
            </Title>
            <EggCountChart logs={logs} />
          </Paper>
        </Grid.Col>
      </Grid>

      <div>
        <Title order={4} mb="sm">
          紀錄明細
        </Title>
        <EggLogHistoryList geckoId={gecko.id} geckoName={gecko.name} logs={logs} onEdit={setEditingLogId} />
      </div>
    </Stack>
  );
}
