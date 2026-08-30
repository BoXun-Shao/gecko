import { Group, NumberInput, Text, Chip } from "@mantine/core";

const PRESETS = [
  { label: "每天", days: 1 },
  { label: "隔天", days: 2 },
  { label: "每3天", days: 3 },
  { label: "每4天", days: 4 },
  { label: "每週", days: 7 },
];

interface IntervalStepperProps {
  value: number;
  onChange: (value: number) => void;
}

export function IntervalStepper({ value, onChange }: IntervalStepperProps) {
  return (
    <Group gap="xs" wrap="wrap" align="center">
      {PRESETS.map((preset) => (
        <Chip
          key={preset.days}
          checked={value === preset.days}
          onChange={() => onChange(preset.days)}
          color="clay"
          variant="filled"
        >
          {preset.label}
        </Chip>
      ))}
      <Group gap={4} align="center">
        <NumberInput
          value={value}
          onChange={(v) => onChange(Number(v) || 1)}
          min={1}
          max={60}
          w={80}
          size="xs"
        />
        <Text size="sm" c="dimmed">
          天餵一次
        </Text>
      </Group>
    </Group>
  );
}
