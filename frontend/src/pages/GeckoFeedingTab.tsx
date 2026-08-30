import { useState } from "react";
import { Grid, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import type { GeckoRead } from "../api/types";
import { useDailyLogs } from "../hooks/useDailyLogs";
import { StatsRow } from "../components/feeding/StatsRow";
import { FeedingBand } from "../components/feeding/FeedingBand";
import { DailyLogForm, type DateJump } from "../components/feeding/DailyLogForm";
import { DailyLogHistoryList } from "../components/feeding/DailyLogHistoryList";
import { WeightChart } from "../components/feeding/WeightChart";
import { IntakeChart } from "../components/feeding/IntakeChart";
import { FoodCompositionChart } from "../components/feeding/FoodCompositionChart";

export function GeckoFeedingTab({ gecko }: { gecko: GeckoRead }) {
  const { data, isLoading, isError } = useDailyLogs(gecko.id);
  const [jumpToDate, setJumpToDate] = useState<DateJump | null>(null);

  if (isLoading) return <Loader color="clay" />;
  if (isError) return <Text c="red">進食紀錄載入失敗，請重新整理再試。</Text>;

  const logs = [...(data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Stack gap="lg">
      <StatsRow logs={logs} intervalDays={gecko.feeding_interval_days} />

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          近 60 天 · {gecko.name}
        </Title>
        <FeedingBand logs={logs} intervalDays={gecko.feeding_interval_days} />
      </Paper>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DailyLogForm geckoId={gecko.id} intervalDays={gecko.feeding_interval_days} logs={logs} jumpToDate={jumpToDate} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="sm">
              體重變化
            </Title>
            <WeightChart logs={logs} />
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper withBorder p="md" radius="md">
        <IntakeChart logs={logs} intervalDays={gecko.feeding_interval_days} />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          餌料組成
        </Title>
        <FoodCompositionChart logs={logs} />
      </Paper>

      <div>
        <Title order={4} mb="sm">
          紀錄明細
        </Title>
        <DailyLogHistoryList geckoId={gecko.id} geckoName={gecko.name} logs={logs} onEdit={setJumpToDate} />
      </div>
    </Stack>
  );
}
