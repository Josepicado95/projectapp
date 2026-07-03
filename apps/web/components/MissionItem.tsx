"use client";

import { useState } from "react";
import { Mission } from "@/lib/generated/prisma/client";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Media",
  3: "Difícil",
};

type Props = {
  mission: Mission;
  onChanged: () => void;
};

export default function MissionItem({ mission, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patchMission(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/mobile/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    await patchMission({ completed: !mission.completed });
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    const difficulty = Number((form.elements.namedItem("difficulty") as HTMLSelectElement).value);
    await patchMission({ title, description: description || undefined, difficulty });
    setEditing(false);
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/mobile/missions/${mission.id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="border rounded p-3 mb-2 bg-white">
        <form onSubmit={handleSaveEdit}>
          <div className="flex gap-2 mb-2">
            <input
              name="title"
              defaultValue={mission.title}
              required
              className="border rounded px-2 py-1 flex-1"
            />
            <select
              name="difficulty"
              defaultValue={mission.difficulty}
              className="border rounded px-2 py-1"
            >
              <option value="1">Fácil</option>
              <option value="2">Media</option>
              <option value="3">Difícil</option>
            </select>
          </div>
          <input
            name="description"
            defaultValue={mission.description ?? ""}
            placeholder="Descripción (opcional)"
            className="border rounded px-2 py-1 w-full mb-2"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`border rounded p-3 mb-2 bg-white flex items-start gap-3 ${mission.completed ? "opacity-60" : ""}`}>
      <button onClick={handleToggle} disabled={busy} className="text-xl leading-none mt-0.5">
        {mission.completed ? "✅" : "⬜"}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${mission.completed ? "line-through text-gray-400" : ""}`}>
          {mission.title}
        </p>
        {mission.description && (
          <p className={`text-sm text-gray-500 ${mission.completed ? "line-through" : ""}`}>
            {mission.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
            {DIFFICULTY_LABELS[mission.difficulty] ?? "—"}
          </span>
          {mission.completed && mission.completedAt && (
            <span className="text-xs text-gray-400">
              Completada: {new Date(mission.completedAt).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs border px-2 py-1 rounded"
        >
          Editar
        </button>
        <button onClick={handleDelete} disabled={busy} className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded disabled:opacity-50">
          Eliminar
        </button>
      </div>
    </div>
  );
}
