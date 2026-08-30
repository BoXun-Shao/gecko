import { useState } from "react";
import { Button, Container, Loader, Stack, Text, Title } from "@mantine/core";
import { Navigate, Route, Routes, useMatch, useNavigate } from "react-router-dom";
import { RosterBar } from "./components/roster/RosterBar";
import { GeckoFormModal } from "./components/gecko/GeckoFormModal";
import { useGeckos } from "./hooks/useGeckos";
import { GeckoTabsShell } from "./pages/GeckoTabsShell";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Stack align="center" py={80} gap="sm">
      <Text c="dimmed">還沒有任何守宮。先建立一隻，就能開始記錄每天的餵食與排便。</Text>
      <Button color="clay" onClick={onAdd}>
        新增第一隻守宮
      </Button>
    </Stack>
  );
}

function RootRedirect({ firstGeckoId }: { firstGeckoId: string }) {
  return <Navigate to={`/geckos/${firstGeckoId}/overview`} replace />;
}

export default function App() {
  const { data: geckos, isLoading } = useGeckos();
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const match = useMatch("/geckos/:geckoId/*");
  const activeId = match?.params.geckoId;

  return (
    <Container size="md" py="xl">
      <Stack gap={4} mb="md">
        <Text tt="uppercase" size="xs" c="dimmed" fw={600} style={{ letterSpacing: "0.18em" }}>
          肥尾日誌
        </Text>
        <Title order={1} style={{ letterSpacing: "0.1em" }}>
          守宮飼育紀錄
        </Title>
      </Stack>

      {isLoading ? (
        <Loader color="clay" />
      ) : (
        <>
          <RosterBar
            geckos={geckos ?? []}
            activeId={activeId}
            onSelect={(id) => navigate(`/geckos/${id}/overview`)}
            onAdd={() => setAddOpen(true)}
          />

          {geckos && geckos.length === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            <Routes>
              <Route path="/geckos/:geckoId/:tab" element={<GeckoTabsShell geckos={geckos ?? []} />} />
              <Route path="*" element={geckos?.length ? <RootRedirect firstGeckoId={geckos[0].id} /> : null} />
            </Routes>
          )}
        </>
      )}

      <GeckoFormModal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(g) => navigate(`/geckos/${g.id}/overview`)}
      />
    </Container>
  );
}
