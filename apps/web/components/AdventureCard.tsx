"use client";

import { useState } from "react";
import Link from "next/link";
import { Adventure, Mission } from "@/lib/generated/prisma/client";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";

type AdventureWithMissions = Adventure & { missions: Mission[] };
type AdventureCardProps = { adventure: AdventureWithMissions };

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  completed: "Completada",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function AdventureCard({ adventure }: AdventureCardProps) {
  const [editing, setEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const total = adventure.missions.length;
  const completed = adventure.missions.filter((m) => m.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (editing) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        {updateError && (
          <p className="text-red-500 text-sm mb-3">{updateError}</p>
        )}
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
          className="space-y-3"
        >
          <input type="hidden" name="id" value={adventure.id} />
          <input
            name="title"
            defaultValue={adventure.title}
            required
            className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            name="description"
            defaultValue={adventure.description ?? ""}
            placeholder="Descripción (opcional)"
            className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            name="status"
            defaultValue={adventure.status}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="completed">Completada</option>
          </select>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border border-slate-200 text-slate-600 px-4 py-1.5 rounded-lg text-sm transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      {/* Title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-semibold text-slate-800">{adventure.title}</h2>
        <span
          className={`text-xs border px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[adventure.status] ?? "bg-slate-100 text-slate-500"}`}
        >
          {STATUS_LABELS[adventure.status] ?? adventure.status}
        </span>
      </div>

      {adventure.description && (
        <p className="text-sm text-slate-400 mb-3">{adventure.description}</p>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{completed} de {total} misiones</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/adventures/${adventure.id}`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          Ver misiones →
        </Link>
        <button
          onClick={() => setEditing(true)}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          Editar
        </button>
        <form action={deleteAdventure}>
          <input type="hidden" name="id" value={adventure.id} />
          <button
            type="submit"
            className="text-rose-500 hover:text-rose-600 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            Eliminar
          </button>
        </form>
      </div>
    </div>
  );
}
