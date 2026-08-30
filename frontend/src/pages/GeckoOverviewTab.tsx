import { useState } from "react";
import { GeckoFormModal } from "../components/gecko/GeckoFormModal";
import { GeckoProfileCard } from "../components/gecko/GeckoProfileCard";
import type { GeckoRead } from "../api/types";

export function GeckoOverviewTab({ gecko }: { gecko: GeckoRead }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <GeckoProfileCard gecko={gecko} onEdit={() => setEditing(true)} />
      <GeckoFormModal opened={editing} onClose={() => setEditing(false)} gecko={gecko} />
    </>
  );
}
