import { Avatar, Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { assetUrl } from "../../api/client";
import type { GeckoRead } from "../../api/types";

const GENDER_LABEL: Record<GeckoRead["gender"], string> = {
  male: "公",
  female: "母",
  unknown: "未知",
};

function daysBetween(from: string, to: Date): number {
  const a = new Date(`${from}T00:00:00`);
  const ms = to.getTime() - a.getTime();
  return Math.floor(ms / 86400000);
}

interface GeckoProfileCardProps {
  gecko: GeckoRead;
  onEdit: () => void;
}

export function GeckoProfileCard({ gecko, onEdit }: GeckoProfileCardProps) {
  const today = new Date();
  return (
    <Paper withBorder p="lg" radius="md">
      <Group align="flex-start" wrap="wrap">
        <Avatar src={assetUrl(gecko.photo_path)} size={96} radius="md" color="clay">
          {gecko.name.charAt(0)}
        </Avatar>
        <Stack gap={4} style={{ flex: 1, minWidth: 200 }}>
          <Title order={2}>{gecko.name}</Title>
          <Text c={gecko.morph ? undefined : "dimmed"} fs={gecko.morph ? undefined : "italic"}>
            {gecko.morph || "未填品系"}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge variant="light" color="clay">
              {GENDER_LABEL[gecko.gender]}
            </Badge>
            {gecko.birth_date && (
              <Badge variant="light" color="clay">
                出生 {gecko.birth_date}
              </Badge>
            )}
            {gecko.acquired_date && (
              <Badge variant="light" color="clay">
                飼養 {daysBetween(gecko.acquired_date, today)} 天
              </Badge>
            )}
            <Badge variant="light" color="clay">
              每 {gecko.feeding_interval_days} 天餵一次
            </Badge>
          </Group>
          {gecko.note && (
            <Text size="sm" c="dimmed" mt={4}>
              {gecko.note}
            </Text>
          )}
          <Button variant="light" color="clay" size="xs" mt="sm" onClick={onEdit} style={{ alignSelf: "flex-start" }}>
            編輯資料與照片
          </Button>
        </Stack>
      </Group>
    </Paper>
  );
}
