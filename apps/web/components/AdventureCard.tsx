"use client";

import { useState } from "react";
import { Adventure, Mission } from "@/lib/generated/prisma/client";
import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";

type AdventureWithMissions = Adventure & { missions: Mission[] };

type AdventureCardProps = {
  adventure: AdventureWithMissions;
};

export default function AdventureCard({ adventure }: AdventureCardProps) {
  const [editing, setEditing] = useState(false);
  const completedCount = adventure.missions.filter((m) => m.completed).length;

  if (editing) {
    return (
      <div>
        <form
          action={async (formData) => {
            await updateAdventure(formData);
            setEditing(false);
          }}
        >
          <input type="hidden" name="id" value={adventure.id} />
          <input name="title" defaultValue={adventure.title} required />
          <input
            name="description"
            defaultValue={adventure.description ?? ""}
            placeholder="Descripción (opcional)"
          />
          <select name="status" defaultValue={adventure.status}>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="completed">Completada</option>
          </select>
          <button type="submit">Guardar</button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>{adventure.title}</h2>
      <p>{adventure.description}</p>
      <p>
        Misiones: {completedCount}/{adventure.missions.length} completadas
      </p>
      <p>Estado: {adventure.status}</p>
      <button onClick={() => setEditing(true)}>Editar</button>
      <form action={deleteAdventure}>
        <input type="hidden" name="id" value={adventure.id} />
        <button type="submit">Eliminar</button>
      </form>
    </div>
  );
}
