"use client";

import { useState } from "react";
import { Mission } from "@/lib/generated/prisma/client";
import { toggleMission, updateMission, deleteMission } from "@/app/actions/missions";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Media",
  3: "Difícil",
};

type Props = {
  mission: Mission;
};

export default function MissionItem({ mission }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border rounded p-3 mb-2 bg-white">
        <form
          action={async (formData) => {
            await updateMission(formData);
            setEditing(false);
          }}
        >
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="adventureId" value={mission.adventureId} />
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
            <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
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
      <form action={toggleMission} className="mt-0.5">
        <input type="hidden" name="id" value={mission.id} />
        <input type="hidden" name="adventureId" value={mission.adventureId} />
        <button type="submit" className="text-xl leading-none">
          {mission.completed ? "✅" : "⬜"}
        </button>
      </form>

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
        <form action={deleteMission}>
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="adventureId" value={mission.adventureId} />
          <button type="submit" className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded">
            Eliminar
          </button>
        </form>
      </div>
    </div>
  );
}
