import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GeckoFormModal } from "../components/gecko/GeckoFormModal";
import { GeckoProfileCard } from "../components/gecko/GeckoProfileCard";
import type { GeckoRead } from "../api/types";

export function GeckoOverviewTab({ gecko }: { gecko: GeckoRead }) {
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <GeckoProfileCard gecko={gecko} onEdit={() => setEditing(true)} />
      <GeckoFormModal
        opened={editing}
        onClose={() => setEditing(false)}
        gecko={gecko}
        onDeleted={() => navigate("/")}
      />
    </>
  );
}
