import { useState } from "react";
import { Alert, Anchor, Grid, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import type { GeckoRead } from "../api/types";
import { useEnvironmentLogs } from "../hooks/useEnvironmentLogs";
import { EnvironmentLogForm } from "../components/environment/EnvironmentLogForm";
import { EnvironmentLogHistoryList } from "../components/environment/EnvironmentLogHistoryList";
import { EnvironmentTrendChart } from "../components/environment/EnvironmentTrendChart";
import { hasConfiguredSafeRange } from "../utils/environment";

export function GeckoEnvironmentTab({ gecko }: { gecko: GeckoRead }) {
  const { data, isLoading, isError } = useEnvironmentLogs(gecko.id);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (isLoading) return <Loader color="clay" />;
  if (isError) return <Text c="red">環境紀錄載入失敗，請重新整理再試。</Text>;

  const logs = [...(data ?? [])].sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
  const editingLog = logs.find((l) => l.id === editingLogId) ?? null;

  return (
    <Stack gap="lg">
      {!hasConfiguredSafeRange(gecko) && (
        <Alert icon={<IconAlertTriangle size={18} />} color="yellow" title="尚未設定安全溫濕度範圍">
          設定安全範圍後，超出範圍的量測會在這裡標示警示。請至{" "}
          <Anchor component="button" type="button" onClick={() => navigate(`/geckos/${gecko.id}/overview`)} c="clay">
            總覽分頁
          </Anchor>{" "}
          編輯守宮資料補充。
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <EnvironmentLogForm
            geckoId={gecko.id}
            editingLog={editingLog}
            onCreated={(log) => setEditingLogId(log.id)}
            onCancelEdit={() => setEditingLogId(null)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="sm">
              溫濕度趨勢
            </Title>
            <EnvironmentTrendChart gecko={gecko} logs={logs} />
          </Paper>
        </Grid.Col>
      </Grid>

      <div>
        <Title order={4} mb="sm">
          紀錄明細
        </Title>
        <EnvironmentLogHistoryList gecko={gecko} logs={logs} onEdit={setEditingLogId} />
      </div>
    </Stack>
  );
}
