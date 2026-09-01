import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  FileButton,
  Group,
  Image,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { assetUrl } from "../../api/client";
import {
  useCreateSheddingLog,
  useDeleteSheddingPhoto,
  useUpdateSheddingLog,
  useUploadSheddingPhotos,
} from "../../hooks/useSheddingLogs";
import type { SheddingLogRead } from "../../api/types";
import { toDate, toDateStr } from "../../utils/dates";

interface FormState {
  note: string;
}

interface SheddingLogFormProps {
  geckoId: string;
  editingLog: SheddingLogRead | null;
  onCreated: (log: SheddingLogRead) => void;
  onCancelEdit: () => void;
}

export function SheddingLogForm({ geckoId, editingLog, onCreated, onCancelEdit }: SheddingLogFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => (editingLog ? toDate(editingLog.date) : new Date()));
  const [form, setForm] = useState<FormState>(() => ({ note: editingLog?.note ?? "" }));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(editingLog ? toDate(editingLog.date) : new Date());
    setForm({ note: editingLog?.note ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLog?.id]);

  const createLog = useCreateSheddingLog(geckoId);
  const updateLog = useUpdateSheddingLog(geckoId);
  const uploadPhotos = useUploadSheddingPhotos(geckoId);
  const deletePhoto = useDeleteSheddingPhoto(geckoId);
  const saving = createLog.isPending || updateLog.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dateStr = toDateStr(selectedDate);
    const payload = { date: dateStr, note: form.note.trim() || null };

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

  async function handleAddPhotos(files: File[]) {
    if (!files.length || !editingLog) return;
    try {
      await uploadPhotos.mutateAsync({ logId: editingLog.id, files });
      notifications.show({ message: `已上傳 ${files.length} 張照片`, color: "green" });
    } catch {
      notifications.show({ message: "照片上傳失敗，請再試一次", color: "red" });
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm("刪除這張照片？")) return;
    try {
      await deletePhoto.mutateAsync(photoId);
    } catch {
      notifications.show({ message: "刪除失敗，請再試一次", color: "red" });
    }
  }

  return (
    <Paper withBorder p="md" radius="md" component="form" onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{editingLog ? "編輯蛻皮紀錄" : "新增蛻皮紀錄"}</Title>
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

        <Textarea
          label="備註"
          autosize
          minRows={2}
          value={form.note}
          onChange={(e) => setForm({ note: e.currentTarget.value })}
        />

        <Button type="submit" color="clay" loading={saving}>
          {editingLog ? "更新這筆紀錄" : "儲存紀錄"}
        </Button>

        <Stack gap={4}>
          <Text size="sm" fw={500}>
            照片
          </Text>
          {!editingLog && (
            <Text size="xs" c="dimmed">
              儲存紀錄後才能上傳照片
            </Text>
          )}
          {editingLog && (
            <>
              {editingLog.photos.length > 0 && (
                <SimpleGrid cols={4} spacing="xs">
                  {editingLog.photos.map((photo, index) => (
                    <div key={photo.id} style={{ position: "relative" }}>
                      <img
                        src={assetUrl(photo.file_path)}
                        alt="蛻皮照片"
                        onClick={() => setPreviewUrl(assetUrl(photo.file_path) ?? null)}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          borderRadius: 6,
                          display: "block",
                          cursor: "pointer",
                        }}
                      />
                      <ActionIcon
                        variant="filled"
                        color="red"
                        size="sm"
                        radius="xl"
                        style={{ position: "absolute", top: 2, right: 2 }}
                        onClick={() => handleDeletePhoto(photo.id)}
                        aria-label={`刪除第 ${index + 1} 張照片`}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </div>
                  ))}
                </SimpleGrid>
              )}
              <FileButton onChange={handleAddPhotos} accept="image/*" multiple>
                {(props) => (
                  <Button {...props} variant="light" color="clay" size="xs" loading={uploadPhotos.isPending}>
                    新增照片
                  </Button>
                )}
              </FileButton>
            </>
          )}
        </Stack>
      </Stack>

      <Modal opened={previewUrl != null} onClose={() => setPreviewUrl(null)} size="lg" centered title="蛻皮照片">
        {previewUrl && <Image src={previewUrl} alt="蛻皮照片" radius="md" />}
      </Modal>
    </Paper>
  );
}
