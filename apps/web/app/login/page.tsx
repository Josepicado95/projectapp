"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

type LoginState = { error?: string };
const initialState: LoginState = {};

function JustRegisteredMessage() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "true") return null;
  return (
    <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
      ¡Cuenta creada! Ya puedes iniciar sesión.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>

      <Suspense>
        <JustRegisteredMessage />
      </Suspense>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {state.error && (
          <p className="text-red-500 text-sm">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-indigo-500">
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
