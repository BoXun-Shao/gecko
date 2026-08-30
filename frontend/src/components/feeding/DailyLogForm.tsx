import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { ApiError } from "../../api/client";
import { useCreateDailyLog, useUpdateDailyLog } from "../../hooks/useDailyLogs";
import type { DailyLogRead, FeedingStatus } from "../../api/types";
import { toDate, toDateStr, todayStr } from "../../utils/dates";
import { isDueDay } from "../../utils/feedingBand";
import { FOODS, sizesFor } from "../../utils/feedingConstants";

const STATUS_LABEL: Record<FeedingStatus, string> = {
  fed: "已餵食",
  partial: "部分進食",
  refused: "拒食",
  skipped: "沒餵（非餵食日）",
};

function computeAutoStatus(qty: number, dueDay: boolean): FeedingStatus {
  if (qty > 0) return "fed";
  return dueDay ? "refused" : "skipped";
}

interface FormState {
  qty: number;
  food: string;
  foodSize: string;
  status: FeedingStatus;
  statusTouched: boolean;
  poop: boolean;
  weight: number | "";
  note: string;
}

function stateFromLog(l: DailyLogRead): FormState {
  return {
    qty: l.qty ?? 0,
    food: l.food ?? FOODS[0],
    foodSize: l.food_size ?? "",
    status: l.status,
    statusTouched: true,
    poop: l.poop,
    weight: l.weight ?? "",
    note: l.note ?? "",
  };
}

function emptyState(qty: number, dueDay: boolean): FormState {
  return {
    qty,
    food: FOODS[0],
    foodSize: "",
    status: computeAutoStatus(qty, dueDay),
    statusTouched: false,
    poop: false,
    weight: "",
    note: "",
  };
}

export interface DateJump {
  date: string;
  nonce: number;
}

interface DailyLogFormProps {
  geckoId: string;
  intervalDays: number;
  logs: DailyLogRead[];
  jumpToDate?: DateJump | null;
}

export function DailyLogForm({ geckoId, intervalDays, logs, jumpToDate }: DailyLogFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateStr = toDateStr(selectedDate);
  const existing = logs.find((l) => l.date === dateStr);

  const [form, setForm] = useState<FormState>(() =>
    existing ? stateFromLog(existing) : emptyState(0, isDueDay(logs, intervalDays, todayStr())),
  );

  const createLog = useCreateDailyLog(geckoId);
  const updateLog = useUpdateDailyLog(geckoId);
  const saving = createLog.isPending || updateLog.isPending;

  function loadDate(newDate: Date) {
    const ds = toDateStr(newDate);
    setSelectedDate(newDate);
    const found = logs.find((l) => l.date === ds);
    setForm(found ? stateFromLog(found) : emptyState(0, isDueDay(logs, intervalDays, ds)));
  }

  useEffect(() => {
    if (jumpToDate) loadDate(toDate(jumpToDate.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToDate?.nonce]);

  function handleQtyChange(qty: number) {
    setForm((prev) => ({
      ...prev,
      qty,
      status: prev.statusTouched ? prev.status : computeAutoStatus(qty, isDueDay(logs, intervalDays, dateStr)),
    }));
  }

  const zeroQty = form.qty === 0;
  const sizeOptions = sizesFor(form.food);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date: dateStr,
      status: form.status,
      qty: form.qty,
      food: form.food.trim() || null,
      food_size: form.foodSize || null,
      poop: form.poop,
      weight: form.weight === "" ? null : Number(form.weight),
      note: form.note.trim() || null,
    };

    try {
      if (existing) {
        await updateLog.mutateAsync({ id: existing.id, body: payload });
        notifications.show({ message: `已更新 ${dateStr}`, color: "green" });
      } else {
        await createLog.mutateAsync(payload);
        notifications.show({ message: `已記錄 ${dateStr}`, color: "green" });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        notifications.show({ message: "這天剛好已經有紀錄了，請重新整理後再試", color: "red" });
      } else {
        notifications.show({ message: "儲存失敗，請再試一次", color: "red" });
      }
    }
  }

  return (
    <Paper withBorder p="md" radius="md" component="form" onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{existing ? "編輯紀錄" : "新增紀錄"}</Title>
          {existing && (
            <Text size="xs" c="dimmed">
              修改中
            </Text>
          )}
        </Group>

        <DateInput
          label="日期"
          valueFormat="YYYY-MM-DD"
          maxDate={new Date()}
          value={selectedDate}
          onChange={(d) => d && loadDate(toDate(d))}
        />

        <Group grow align="flex-end">
          <NumberInput
            label="進食數量（0 ＝ 拒食／沒餵）"
            min={0}
            max={99}
            allowDecimal={false}
            value={form.qty}
            onChange={(v) => handleQtyChange(Number(v) || 0)}
          />
          <TextInput
            label="餌料"
            list="food-suggestions"
            value={form.food}
            onChange={(e) => setForm((prev) => ({ ...prev, food: e.currentTarget.value, foodSize: "" }))}
          />
          <datalist id="food-suggestions">
            {FOODS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Group>

        <Stack gap={4}>
          <Text size="sm" fw={500}>
            狀態
          </Text>
          <SegmentedControl
            value={form.status}
            onChange={(v) => setForm((prev) => ({ ...prev, status: v as FeedingStatus, statusTouched: true }))}
            data={[
              { value: "fed", label: STATUS_LABEL.fed },
              { value: "partial", label: STATUS_LABEL.partial },
              { value: "refused", label: STATUS_LABEL.refused },
              { value: "skipped", label: STATUS_LABEL.skipped },
            ]}
          />
        </Stack>

        <Stack gap={4} style={{ opacity: zeroQty ? 0.5 : 1 }}>
          <Text size="sm" fw={500}>
            餌料尺寸
          </Text>
          <Group gap={6} wrap="wrap">
            <Chip checked={!form.foodSize} onChange={() => setForm((prev) => ({ ...prev, foodSize: "" }))} color="clay">
              未指定
            </Chip>
            {sizeOptions.map((s) => (
              <Chip
                key={s}
                checked={form.foodSize === s}
                onChange={() => setForm((prev) => ({ ...prev, foodSize: s }))}
                color="clay"
              >
                {s}
              </Chip>
            ))}
          </Group>
        </Stack>

        <Group grow>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              排便
            </Text>
            <SegmentedControl
              value={form.poop ? "yes" : "no"}
              onChange={(v) => setForm((prev) => ({ ...prev, poop: v === "yes" }))}
              data={[
                { value: "yes", label: "有" },
                { value: "no", label: "無" },
              ]}
            />
          </Stack>
          <NumberInput
            label="體重（g，選填）"
            min={0}
            step={0.1}
            decimalScale={1}
            placeholder="—"
            value={form.weight}
            onChange={(v) => setForm((prev) => ({ ...prev, weight: v === "" ? "" : Number(v) }))}
          />
        </Group>

        <Textarea
          label="備註"
          autosize
          minRows={2}
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.currentTarget.value }))}
        />

        <Button type="submit" color="clay" loading={saving}>
          {existing ? "更新這筆紀錄" : "儲存紀錄"}
        </Button>
      </Stack>
    </Paper>
  );
}
