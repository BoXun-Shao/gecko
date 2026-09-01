import { useEffect, useRef } from "react";
import { Button, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { assetUrl } from "../../api/client";
import { useCreateGecko, useDeleteGecko, useUpdateGecko, useUploadGeckoPhoto } from "../../hooks/useGeckos";
import type { GeckoRead } from "../../api/types";
import { IntervalStepper } from "../shared/IntervalStepper";
import { PhotoUpload } from "../shared/PhotoUpload";

interface FormValues {
  name: string;
  gender: "male" | "female" | "unknown";
  morph: string;
  birthDate: Date | null;
  acquiredDate: Date | null;
  feedingIntervalDays: number;
  note: string;
  safeTempMin: number | "";
  safeTempMax: number | "";
  safeHumidityMin: number | "";
  safeHumidityMax: number | "";
}

function toDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function toDateString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyValues(): FormValues {
  return {
    name: "",
    gender: "unknown",
    morph: "",
    birthDate: null,
    acquiredDate: null,
    feedingIntervalDays: 7,
    note: "",
    safeTempMin: "",
    safeTempMax: "",
    safeHumidityMin: "",
    safeHumidityMax: "",
  };
}

function valuesFromGecko(g: GeckoRead): FormValues {
  return {
    name: g.name,
    gender: g.gender,
    morph: g.morph ?? "",
    birthDate: toDate(g.birth_date),
    acquiredDate: toDate(g.acquired_date),
    feedingIntervalDays: g.feeding_interval_days,
    note: g.note ?? "",
    safeTempMin: g.safe_temp_min ?? "",
    safeTempMax: g.safe_temp_max ?? "",
    safeHumidityMin: g.safe_humidity_min ?? "",
    safeHumidityMax: g.safe_humidity_max ?? "",
  };
}

interface GeckoFormModalProps {
  opened: boolean;
  onClose: () => void;
  gecko?: GeckoRead;
  onSaved?: (gecko: GeckoRead) => void;
  onDeleted?: () => void;
}

export function GeckoFormModal({ opened, onClose, gecko, onSaved, onDeleted }: GeckoFormModalProps) {
  const createGecko = useCreateGecko();
  const updateGecko = useUpdateGecko();
  const uploadPhoto = useUploadGeckoPhoto();
  const deleteGecko = useDeleteGecko();

  const form = useForm<FormValues>({
    initialValues: emptyValues(),
    validate: {
      name: (v) => (v.trim() ? null : "請輸入名字"),
    },
  });

  const pendingPhotoRef = useRef<File | undefined>(undefined);

  useEffect(() => {
    if (opened) {
      form.setValues(gecko ? valuesFromGecko(gecko) : emptyValues());
      form.resetDirty();
      pendingPhotoRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, gecko]);

  const handleSubmit = form.onSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      gender: values.gender,
      morph: values.morph.trim() || null,
      birth_date: toDateString(values.birthDate),
      acquired_date: toDateString(values.acquiredDate),
      feeding_interval_days: values.feedingIntervalDays,
      note: values.note.trim() || null,
      safe_temp_min: values.safeTempMin === "" ? null : Number(values.safeTempMin),
      safe_temp_max: values.safeTempMax === "" ? null : Number(values.safeTempMax),
      safe_humidity_min: values.safeHumidityMin === "" ? null : Number(values.safeHumidityMin),
      safe_humidity_max: values.safeHumidityMax === "" ? null : Number(values.safeHumidityMax),
    };

    let saved: GeckoRead;
    try {
      saved = gecko
        ? await updateGecko.mutateAsync({ id: gecko.id, body: payload })
        : await createGecko.mutateAsync(payload);
    } catch {
      notifications.show({ message: "儲存失敗，請再試一次", color: "red" });
      return;
    }

    if (pendingPhotoRef.current) {
      try {
        saved = await uploadPhoto.mutateAsync({ id: saved.id, file: pendingPhotoRef.current });
      } catch {
        notifications.show({ message: "守宮資料已儲存，但照片上傳失敗，可再次編輯重新上傳", color: "yellow" });
        onSaved?.(saved);
        onClose();
        return;
      }
    }

    notifications.show({ message: gecko ? "已更新守宮資料" : "已新增守宮", color: "green" });
    onSaved?.(saved);
    onClose();
  });

  async function handleDelete() {
    if (!gecko) return;
    if (!window.confirm(`刪除「${gecko.name}」及其所有紀錄？此動作無法復原。`)) return;
    try {
      await deleteGecko.mutateAsync(gecko.id);
      notifications.show({ message: "已刪除", color: "green" });
      onDeleted?.();
      onClose();
    } catch {
      notifications.show({ message: "刪除失敗，請再試一次", color: "red" });
    }
  }

  const saving = createGecko.isPending || updateGecko.isPending || uploadPhoto.isPending;

  return (
    <Modal opened={opened} onClose={onClose} title={gecko ? "編輯守宮資料" : "新增守宮"} centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group justify="center">
            <PhotoUpload
              previewUrl={assetUrl(gecko?.photo_path)}
              placeholder={form.values.name.charAt(0) || "?"}
              onSelect={(f) => {
                pendingPhotoRef.current = f;
              }}
            />
          </Group>
          <TextInput label="名字" required {...form.getInputProps("name")} />
          <Select
            label="性別"
            data={[
              { value: "unknown", label: "未知" },
              { value: "male", label: "公" },
              { value: "female", label: "母" },
            ]}
            {...form.getInputProps("gender")}
          />
          <TextInput label="品系" {...form.getInputProps("morph")} />
          <Group grow>
            <DateInput
              label="出生日期"
              valueFormat="YYYY-MM-DD"
              clearable
              maxDate={new Date()}
              {...form.getInputProps("birthDate")}
            />
            <DateInput
              label="入手日期"
              valueFormat="YYYY-MM-DD"
              clearable
              maxDate={new Date()}
              {...form.getInputProps("acquiredDate")}
            />
          </Group>
          <Stack gap={4}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>餵食頻率</label>
            <IntervalStepper
              value={form.values.feedingIntervalDays}
              onChange={(v) => form.setFieldValue("feedingIntervalDays", v)}
            />
          </Stack>
          <Group grow>
            <NumberInput label="安全溫度下限 (°C)" {...form.getInputProps("safeTempMin")} />
            <NumberInput label="安全溫度上限 (°C)" {...form.getInputProps("safeTempMax")} />
          </Group>
          <Group grow>
            <NumberInput label="安全濕度下限 (%)" {...form.getInputProps("safeHumidityMin")} />
            <NumberInput label="安全濕度上限 (%)" {...form.getInputProps("safeHumidityMax")} />
          </Group>
          <Textarea label="備註" autosize minRows={2} {...form.getInputProps("note")} />
          <Group justify="space-between" mt="sm">
            {gecko ? (
              <Button variant="subtle" color="red" onClick={handleDelete} type="button" loading={deleteGecko.isPending}>
                刪除這隻
              </Button>
            ) : (
              <div />
            )}
            <Group>
              <Button variant="subtle" onClick={onClose} type="button">
                取消
              </Button>
              <Button type="submit" loading={saving} color="clay">
                儲存
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
