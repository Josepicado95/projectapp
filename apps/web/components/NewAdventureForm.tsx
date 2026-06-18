"use client";

import { useActionState } from "react";
import { createAdventure } from "@/app/actions/adventures";

const initialState: { errors?: { title?: string[] }; message?: string } = {};

export default function NewAdventureForm() {
  const [state, formAction, pending] = useActionState(createAdventure, initialState);

  return (
    <form action={formAction}>
      <div>
        <input name="title" placeholder="Título de la aventura" required />
        {state.errors?.title && <p style={{ color: "red" }}>{state.errors.title[0]}</p>}
      </div>
      <div>
        <input name="description" placeholder="Descripción (opcional)" />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Nueva Aventura"}
      </button>
      {state.message && <p style={{ color: "green" }}>{state.message}</p>}
    </form>
  );
}
