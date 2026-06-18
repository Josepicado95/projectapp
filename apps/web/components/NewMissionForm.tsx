"use client";

import { useActionState } from "react";
import { createMission } from "@/app/actions/missions";

type ActionState = {
  errors?: { title?: string[]; difficulty?: string[] };
  message?: string;
};

type Props = {
  adventureId: number;
};

const initialState: ActionState = {};

export default function NewMissionForm({ adventureId }: Props) {
  const [state, formAction, pending] = useActionState(createMission, initialState);

  return (
    <form action={formAction} className="border rounded p-4 mb-6 bg-gray-50">
      <h3 className="font-medium mb-3">Nueva misión</h3>

      <input type="hidden" name="adventureId" value={adventureId} />

      <div className="mb-3">
        <input
          name="title"
          placeholder="Título de la misión"
          required
          className="border rounded px-2 py-1 w-full"
        />
        {state.errors?.title && (
          <p className="text-red-500 text-sm mt-1">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="mb-3">
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="mb-3">
        <select
          name="difficulty"
          defaultValue="1"
          className="border rounded px-2 py-1"
        >
          <option value="1">Fácil</option>
          <option value="2">Media</option>
          <option value="3">Difícil</option>
        </select>
        {state.errors?.difficulty && (
          <p className="text-red-500 text-sm mt-1">{state.errors.difficulty[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-indigo-500 text-white px-4 py-1 rounded disabled:opacity-50"
      >
        {pending ? "Agregando..." : "Agregar misión"}
      </button>

      {state.message && (
        <p className="text-green-600 text-sm mt-2">{state.message}</p>
      )}
    </form>
  );
}
