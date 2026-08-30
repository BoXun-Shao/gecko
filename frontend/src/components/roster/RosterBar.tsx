import { Avatar, Group, UnstyledButton, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { assetUrl } from "../../api/client";
import type { GeckoRead } from "../../api/types";

interface RosterBarProps {
  geckos: GeckoRead[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function RosterBar({ geckos, activeId, onSelect, onAdd }: RosterBarProps) {
  return (
    <Group gap="xs" wrap="wrap" py="sm">
      {geckos.map((g) => (
        <UnstyledButton
          key={g.id}
          onClick={() => onSelect(g.id)}
          aria-pressed={g.id === activeId}
          style={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px 6px 6px",
            borderRadius: 999,
            border: `1px solid ${g.id === activeId ? theme.colors.clay[5] : theme.other.umber2}`,
            background: g.id === activeId ? theme.other.umber : "transparent",
            color: g.id === activeId ? theme.other.sand : theme.other.mute,
          })}
        >
          <Avatar src={assetUrl(g.photo_path)} size={24} radius="xl" color="clay">
            {g.name.charAt(0)}
          </Avatar>
          <Text size="sm">{g.name}</Text>
        </UnstyledButton>
      ))}
      <UnstyledButton
        onClick={onAdd}
        style={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 999,
          border: `1px dashed ${theme.other.umber2}`,
          color: theme.other.mute,
        })}
      >
        <IconPlus size={14} />
        <Text size="sm">新增守宮</Text>
      </UnstyledButton>
    </Group>
  );
}
