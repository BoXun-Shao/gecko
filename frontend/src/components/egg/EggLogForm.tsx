import { useEffect, useState } from "react";
import { Button, Group, NumberInput, Paper, Stack, Textarea, Title } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useCreateEggLog, useUpdateEggLog } from "../../hooks/useEggLogs";
import type { EggLogRead } from "../../api/types";
import { toDate, toDateStr } from "../../utils/dates";

interface FormState {
  eggCount: number | "";
  note: string;
}

function stateFromLog(l: EggLogRead): FormState {
  return { eggCount: l.egg_count, note: l.note ?? "" };
}

function emptyState(): FormState {
  return { eggCount: "", note: "" };
}

interface EggLogFormProps {
  geckoId: string;
  editingLog: EggLogRead | null;
  onCreated: (log: EggLogRead) => void;
  onCancelEdit: () => void;
}

export function EggLogForm({ geckoId, editingLog, onCreated, onCancelEdit }: EggLogFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => (editingLog ? toDate(editingLog.date) : new Date()));
  const [form, setForm] = useState<FormState>(() => (editingLog ? stateFromLog(editingLog) : emptyState()));

  useEffect(() => {
    setSelectedDate(editingLog ? toDate(editingLog.date) : new Date());
    setForm(editingLog ? stateFromLog(editingLog) : emptyState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLog?.id]);

  const createLog = useCreateEggLog(geckoId);
  const updateLog = useUpdateEggLog(geckoId);
  const saving = createLog.isPending || updateLog.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.eggCount === "") {
      notifications.show({ message: "請輸入蛋數", color: "red" });
      return;
    }

    const dateStr = toDateStr(selectedDate);
    const payload = { date: dateStr, egg_count: Number(form.eggCount), note: form.note.trim() || null };

    try {
      if (editingLog) {
        await updateLog.mutateAsync({ id: editingLog.id, body: payload });
        notifications.show({ message: `已更新 ${dateStr}`, color: "green" });
      } else {
        const created = await createLog.mutateAsync(payload);
        notifications.show({ message: `已記錄 ${dateStr}`, color: "green" });
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
          <Title order={4}>{editingLog ? "編輯下蛋紀錄" : "新增下蛋紀錄"}</Title>
          {editingLog && (
            <Button variant="subtle" size="xs" onClick={onCancelEdit} type="button">
              新增下一筆
            </Button>
          )}
        </Group>

        <DateInput
          label="日期"
          valueFormat="YYYY-MM-DD"
          maxDate={new Date()}
          value={selectedDate}
          onChange={(d) => d && setSelectedDate(toDate(d))}
        />

        <NumberInput
          label="蛋數"
          required
          min={0}
          allowDecimal={false}
          value={form.eggCount}
          onChange={(v) => setForm((prev) => ({ ...prev, eggCount: v === "" ? "" : Number(v) }))}
        />

        <Textarea
          label="備註"
          autosize
          minRows={2}
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.currentTarget.value }))}
        />

        <Button type="submit" color="clay" loading={saving}>
          {editingLog ? "更新這筆紀錄" : "儲存紀錄"}
        </Button>
      </Stack>
    </Paper>
  );
}
