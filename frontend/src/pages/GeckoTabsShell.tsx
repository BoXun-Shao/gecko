import { Tabs } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import type { GeckoRead } from "../api/types";
import { GeckoOverviewTab } from "./GeckoOverviewTab";
import { GeckoFeedingTab } from "./GeckoFeedingTab";
import { ComingSoonTab } from "./ComingSoonTab";

const TABS = [
  { value: "overview", label: "總覽" },
  { value: "feeding", label: "進食" },
  { value: "shedding", label: "蛻皮" },
  { value: "environment", label: "環境" },
  { value: "egg", label: "下蛋" },
];

export function GeckoTabsShell({ geckos }: { geckos: GeckoRead[] }) {
  const { geckoId, tab } = useParams();
  const navigate = useNavigate();
  const gecko = geckos.find((g) => g.id === geckoId);

  if (!gecko) return null;

  const activeTab = TABS.some((t) => t.value === tab) ? tab : "overview";

  return (
    <Tabs value={activeTab} onChange={(value) => navigate(`/geckos/${gecko.id}/${value}`)} color="clay" mt="lg">
      <Tabs.List>
        {TABS.map((t) => (
          <Tabs.Tab key={t.value} value={t.value}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      <Tabs.Panel value="overview" pt="md">
        <GeckoOverviewTab gecko={gecko} />
      </Tabs.Panel>
      <Tabs.Panel value="feeding" pt="md">
        <GeckoFeedingTab gecko={gecko} />
      </Tabs.Panel>
      <Tabs.Panel value="shedding" pt="md">
        <ComingSoonTab label="蛻皮" />
      </Tabs.Panel>
      <Tabs.Panel value="environment" pt="md">
        <ComingSoonTab label="環境" />
      </Tabs.Panel>
      <Tabs.Panel value="egg" pt="md">
        <ComingSoonTab label="下蛋" />
      </Tabs.Panel>
    </Tabs>
  );
}
