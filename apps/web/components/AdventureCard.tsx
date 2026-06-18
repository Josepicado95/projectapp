"use client";

import { useState } from "react";
import Link from "next/link";
import { Adventure, Mission } from "@/lib/generated/prisma/client";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";

type AdventureWithMissions = Adventure & { missions: Mission[] };

type AdventureCardProps = {
  adventure: AdventureWithMissions;
};

export default function AdventureCard({ adventure }: AdventureCardProps) {
  const [editing, setEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const completedCount = adventure.missions.filter((m) => m.completed).length;

  if (editing) {
    return (
      <div className="border rounded p-4 mb-4">
        {updateError && <p className="text-red-500 text-sm mb-2">{updateError}</p>}
        <form
          action={async (formData) => {
            try {
              setUpdateError(null);
              await updateAdventure(formData);
              setEditing(false);
            } catch {
              setUpdateError("Error al guardar. Verifica los datos.");
            }
          }}
        >
          <input type="hidden" name="id" value={adventure.id} />
          <div className="mb-2">
            <input
              name="title"
              defaultValue={adventure.title}
              required
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="mb-2">
            <input
              name="description"
              defaultValue={adventure.description ?? ""}
              placeholder="Descripción (opcional)"
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="mb-2">
            <select
              name="status"
              defaultValue={adventure.status}
              className="border rounded px-2 py-1"
            >
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="border px-3 py-1 rounded"
          >
            Cancelar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 mb-4">
      <h2 className="text-xl font-semibold">{adventure.title}</h2>
      {adventure.description && <p className="text-gray-600">{adventure.description}</p>}
      <p className="text-sm mt-1">
        Misiones: {completedCount}/{adventure.missions.length} completadas
      </p>
      <p className="text-sm">Estado: {adventure.status}</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        <Link
          href={`/adventures/${adventure.id}`}
          className="bg-indigo-500 text-white px-3 py-1 rounded text-sm"
        >
          Ver misiones →
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="border px-3 py-1 rounded text-sm"
        >
          Editar
        </button>
        <form action={deleteAdventure}>
          <input type="hidden" name="id" value={adventure.id} />
          <button type="submit" className="text-red-500 border border-red-300 px-3 py-1 rounded text-sm">
            Eliminar
          </button>
        </form>
      </div>
    </div>
  );
}
