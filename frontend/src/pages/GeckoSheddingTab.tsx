import { useState } from "react";
import { Loader, Stack, Text, Title } from "@mantine/core";
import type { GeckoRead } from "../api/types";
import { useSheddingLogs } from "../hooks/useSheddingLogs";
import { SheddingLogForm } from "../components/shedding/SheddingLogForm";
import { SheddingLogHistoryList } from "../components/shedding/SheddingLogHistoryList";

export function GeckoSheddingTab({ gecko }: { gecko: GeckoRead }) {
  const { data, isLoading, isError } = useSheddingLogs(gecko.id);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  if (isLoading) return <Loader color="clay" />;
  if (isError) return <Text c="red">蛻皮紀錄載入失敗，請重新整理再試。</Text>;

  const logs = [...(data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const editingLog = logs.find((l) => l.id === editingLogId) ?? null;

  return (
    <Stack gap="lg">
      <SheddingLogForm
        geckoId={gecko.id}
        editingLog={editingLog}
        onCreated={(log) => setEditingLogId(log.id)}
        onCancelEdit={() => setEditingLogId(null)}
      />

      <div>
        <Title order={4} mb="sm">
          紀錄明細
        </Title>
        <SheddingLogHistoryList geckoId={gecko.id} geckoName={gecko.name} logs={logs} onEdit={setEditingLogId} />
      </div>
    </Stack>
  );
}
