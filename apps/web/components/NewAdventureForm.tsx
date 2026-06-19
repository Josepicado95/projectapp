"use client";

import { useActionState } from "react";
import { createAdventure } from "@/app/actions/adventures";

const initialState: { errors?: { title?: string[] }; message?: string } = {};

export default function NewAdventureForm() {
  const [state, formAction, pending] = useActionState(createAdventure, initialState);

  return (
    <form action={formAction} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-3">Nueva aventura</p>
      <div className="space-y-2">
        <input
          name="title"
          placeholder="¿Qué quieres lograr?"
          required
          className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
        />
        {state.errors?.title && (
          <p className="text-rose-500 text-xs">{state.errors.title[0]}</p>
        )}
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
        />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {pending ? "Creando..." : "+ Crear aventura"}
        </button>
        {state.message && (
          <p className="text-emerald-600 text-xs">{state.message}</p>
        )}
      </div>
    </form>
  );
}
