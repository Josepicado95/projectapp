"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] };
  general?: string;
};
const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Crear cuenta</h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            name="name"
            type="text"
            required
            className="border rounded px-3 py-2 w-full"
          />
          {state.errors?.name && (
            <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="border rounded px-3 py-2 w-full"
          />
          {state.errors?.email && (
            <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            className="border rounded px-3 py-2 w-full"
          />
          {state.errors?.password && (
            <p className="text-red-500 text-sm mt-1">{state.errors.password[0]}</p>
          )}
        </div>

        {state.general && (
          <p className="text-red-500 text-sm">{state.general}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-indigo-500">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
