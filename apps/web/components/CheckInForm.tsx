"use client";

import { useActionState, useState } from "react";
import { saveCheckIn } from "@/app/actions/checkins";

type CheckInValues = {
  energy: number;
  mood: number;
  stress: number;
  sleep: number;
};

type Props = {
  today?: CheckInValues;
};

type CheckInState = { message?: string; error?: string };

const LABELS: Record<keyof CheckInValues, string> = {
  energy: "Energía",
  mood: "Ánimo",
  stress: "Estrés",
  sleep: "Sueño",
};

const initialState: CheckInState = {};

export default function CheckInForm({ today }: Props) {
  const [values, setValues] = useState<CheckInValues>(
    today ?? { energy: 3, mood: 3, stress: 3, sleep: 3 }
  );
  const [state, formAction, pending] = useActionState(saveCheckIn, initialState);

  return (
    <form action={formAction} className="border rounded p-6 bg-white mb-8">
      <h2 className="text-lg font-semibold mb-4">
        {today ? "Actualizar check-in de hoy" : "Check-in de hoy"}
      </h2>

      <div className="space-y-5">
        {(Object.keys(LABELS) as (keyof CheckInValues)[]).map((field) => (
          <div key={field}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium">{LABELS[field]}</label>
              <span className="text-sm font-bold text-indigo-600">{values[field]}/5</span>
            </div>
            <input
              type="range"
              name={field}
              min="1"
              max="5"
              value={values[field]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field]: Number(e.target.value) }))
              }
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 bg-indigo-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {pending ? "Guardando..." : today ? "Actualizar" : "Guardar check-in"}
      </button>

      {state.message && (
        <p className="text-green-600 text-sm mt-3 text-center">{state.message}</p>
      )}
      {state.error && (
        <p className="text-red-500 text-sm mt-3 text-center">{state.error}</p>
      )}
    </form>
  );
}
