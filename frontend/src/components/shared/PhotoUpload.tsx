import { useRef, useState } from "react";
import { ActionIcon, Avatar, Group, Stack, Text } from "@mantine/core";
import { IconCamera, IconX } from "@tabler/icons-react";

const MAX_DIMENSION = 800;

async function resizeToSquareJpeg(file: File): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const side = Math.min(img.width, img.height);
  const size = Math.min(side, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

interface PhotoUploadProps {
  previewUrl?: string;
  placeholder: string;
  onSelect: (file: File) => void;
  onClear?: () => void;
}

export function PhotoUpload({ previewUrl, placeholder, onSelect, onClear }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | undefined>();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const resized = await resizeToSquareJpeg(file);
    setLocalPreview(URL.createObjectURL(resized));
    onSelect(resized);
  };

  const shown = localPreview ?? previewUrl;

  return (
    <Stack gap={6} align="center">
      <Avatar src={shown} size={96} radius="md" color="clay">
        {placeholder}
      </Avatar>
      <Group gap={6}>
        <ActionIcon variant="light" color="clay" onClick={() => inputRef.current?.click()} aria-label="選擇照片">
          <IconCamera size={16} />
        </ActionIcon>
        {shown && onClear && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              setLocalPreview(undefined);
              onClear();
            }}
            aria-label="移除照片"
          >
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>
      <Text size="xs" c="dimmed">
        {shown ? "更換照片" : "選擇照片"}
      </Text>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
    </Stack>
  );
}
