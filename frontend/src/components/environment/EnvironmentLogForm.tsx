import { useEffect, useState } from "react";
import { Button, Group, NumberInput, Paper, SegmentedControl, Stack, Title } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useCreateEnvironmentLog, useUpdateEnvironmentLog } from "../../hooks/useEnvironmentLogs";
import type { EnvironmentLogRead, EnvironmentSource } from "../../api/types";

interface FormState {
  temperature: number | "";
  humidity: number | "";
  source: EnvironmentSource;
}

function stateFromLog(l: EnvironmentLogRead): FormState {
  return { temperature: Number(l.temperature), humidity: Number(l.humidity), source: l.source };
}

function emptyState(): FormState {
  return { temperature: "", humidity: "", source: "manual" };
}

interface EnvironmentLogFormProps {
  geckoId: string;
  editingLog: EnvironmentLogRead | null;
  onCreated: (log: EnvironmentLogRead) => void;
  onCancelEdit: () => void;
}

export function EnvironmentLogForm({ geckoId, editingLog, onCreated, onCancelEdit }: EnvironmentLogFormProps) {
  const [recordedAt, setRecordedAt] = useState<Date>(() => (editingLog ? new Date(editingLog.recorded_at) : new Date()));
  const [form, setForm] = useState<FormState>(() => (editingLog ? stateFromLog(editingLog) : emptyState()));

  useEffect(() => {
    setRecordedAt(editingLog ? new Date(editingLog.recorded_at) : new Date());
    setForm(editingLog ? stateFromLog(editingLog) : emptyState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLog?.id]);

  const createLog = useCreateEnvironmentLog(geckoId);
  const updateLog = useUpdateEnvironmentLog(geckoId);
  const saving = createLog.isPending || updateLog.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.temperature === "" || form.humidity === "") {
      notifications.show({ message: "請輸入溫度與濕度", color: "red" });
      return;
    }

    const payload = {
      recorded_at: recordedAt.toISOString(),
      temperature: Number(form.temperature),
      humidity: Number(form.humidity),
      source: form.source,
    };

    try {
      if (editingLog) {
        await updateLog.mutateAsync({ id: editingLog.id, body: payload });
        notifications.show({ message: "已更新這筆紀錄", color: "green" });
      } else {
        const created = await createLog.mutateAsync(payload);
        notifications.show({ message: "已記錄這次量測", color: "green" });
        onCreated(created);
      }
    } catch {
      notifications.show({ message: "儲存失敗，請再試一次", color: "red" });
    }
  }

  return (
    <Paper withBorder p="md" radius="md" component="form" onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{editingLog ? "編輯環境紀錄" : "新增環境紀錄"}</Title>
          {editingLog && (
            <Button variant="subtle" size="xs" onClick={onCancelEdit} type="button">
              新增下一筆
            </Button>
          )}
        </Group>

        <DateTimePicker
          label="量測時間"
          valueFormat="YYYY-MM-DD HH:mm"
          maxDate={new Date()}
          value={recordedAt}
          onChange={(v) => v && setRecordedAt(new Date(v.replace(" ", "T")))}
        />

        <Group grow>
          <NumberInput
            label="溫度 (°C)"
            required
            step={0.1}
            decimalScale={1}
            value={form.temperature}
            onChange={(v) => setForm((prev) => ({ ...prev, temperature: v === "" ? "" : Number(v) }))}
          />
          <NumberInput
            label="濕度 (%)"
            required
            min={0}
            max={100}
            step={0.1}
            decimalScale={1}
            value={form.humidity}
            onChange={(v) => setForm((prev) => ({ ...prev, humidity: v === "" ? "" : Number(v) }))}
          />
        </Group>

        <Stack gap={4}>
          <SegmentedControl
            value={form.source}
            onChange={(v) => setForm((prev) => ({ ...prev, source: v as EnvironmentSource }))}
            data={[
              { value: "manual", label: "手動量測" },
              { value: "sensor", label: "感測器" },
            ]}
          />
        </Stack>

        <Button type="submit" color="clay" loading={saving}>
          {editingLog ? "更新這筆紀錄" : "儲存紀錄"}
        </Button>
      </Stack>
    </Paper>
  );
}
