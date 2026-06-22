# Fase 6 — Daily Check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una página de check-in diario donde el usuario registra su energía, ánimo, estrés y sueño (escala 1-5), con regla de un check-in por día (update si ya existe) y un historial de los últimos 7 días.

**Architecture:** Server Action con lógica find-then-upsert para la regla "un por día" en UTC. `CheckInForm` es Client Component (necesita sliders con valor en vivo y `useActionState`). `CheckInHistory` es Server Component (lectura directa de Prisma). La página `/checkin` es Server Component que lee la sesión, busca el check-in de hoy si existe (para pre-poblar el form), y renderiza ambos componentes. Un enlace en el Dashboard conecta las dos páginas.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 7, zod, Tailwind CSS básico, Auth.js v5.

## Global Constraints

- `"use server"` en la primera línea de archivos de acciones; `"use client"` en la primera línea de componentes de cliente.
- Leer la sesión con `auth()` de `@/auth` — nunca hardcodear `userId`.
- "Un check-in por día" = mismo día en UTC (medianoche a medianoche UTC). Deuda técnica de timezone documentada para iteración futura.
- Escala de valores: enteros del 1 al 5 para los cuatro campos (energy, mood, stress, sleep).
- Nombres de variables y funciones en inglés; UI y mensajes en español.
- Sin tests automatizados — verificación manual en el navegador (tests son Fase 11).
- El modelo `CheckIn` ya existe en Prisma con campos: `id`, `energy`, `mood`, `stress`, `sleep`, `date`, `userId`. No se necesita migración.

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `apps/web/app/actions/checkins.ts` |
| Crear | `apps/web/components/CheckInForm.tsx` |
| Crear | `apps/web/components/CheckInHistory.tsx` |
| Crear | `apps/web/app/checkin/page.tsx` |
| Modificar | `apps/web/app/page.tsx` |

---

## Task 1: Server Action `saveCheckIn`

**Files:**
- Create: `apps/web/app/actions/checkins.ts`

**Interfaces:**
- Consumes: `auth()` de `@/auth`
- Consumes: `prisma.checkIn.findFirst`, `prisma.checkIn.update`, `prisma.checkIn.create`
- Produces: `saveCheckIn(prevState, formData)` → `Promise<CheckInState>`
- Tipo `CheckInState` = `{ message?: string; error?: string }`

- [ ] **Step 1: Crear `apps/web/app/actions/checkins.ts`**

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type CheckInState = { message?: string; error?: string };

const CheckInSchema = z.object({
  energy: z.coerce.number().int().min(1).max(5),
  mood: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5),
  sleep: z.coerce.number().int().min(1).max(5),
});

export async function saveCheckIn(
  prevState: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const userId = Number(session.user.id);

  const result = CheckInSchema.safeParse({
    energy: formData.get("energy"),
    mood: formData.get("mood"),
    stress: formData.get("stress"),
    sleep: formData.get("sleep"),
  });

  if (!result.success) {
    return { error: "Valores inválidos. Asegúrate de que todos estén entre 1 y 5." };
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const existing = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  });

  if (existing) {
    await prisma.checkIn.update({
      where: { id: existing.id },
      data: result.data,
    });
  } else {
    await prisma.checkIn.create({
      data: { ...result.data, userId },
    });
  }

  revalidatePath("/checkin");
  return { message: existing ? "¡Check-in actualizado!" : "¡Check-in guardado!" };
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/actions/checkins.ts
git commit -m "feat: add saveCheckIn server action with one-per-day upsert logic"
```

---

## Task 2: Componente `CheckInForm`

**Files:**
- Create: `apps/web/components/CheckInForm.tsx`

**Interfaces:**
- Consumes: `saveCheckIn` de `@/app/actions/checkins`
- Consumes: `useActionState`, `useState` de `react`
- Props: `{ today?: { energy: number; mood: number; stress: number; sleep: number } }`
- Produces: formulario con 4 sliders (1-5) que muestra el valor en vivo y mensaje de confirmación

- [ ] **Step 1: Crear `apps/web/components/CheckInForm.tsx`**

```typescript
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/CheckInForm.tsx
git commit -m "feat: add CheckInForm component with live sliders"
```

---

## Task 3: Componente `CheckInHistory`

**Files:**
- Create: `apps/web/components/CheckInHistory.tsx`

**Interfaces:**
- Consumes: tipo `CheckIn` de `@/lib/generated/prisma/client`
- Props: `{ checkIns: CheckIn[] }`
- Produces: tabla con los últimos check-ins (fecha + 4 valores con indicador visual)

- [ ] **Step 1: Crear `apps/web/components/CheckInHistory.tsx`**

```typescript
import { CheckIn } from "@/lib/generated/prisma/client";

type Props = {
  checkIns: CheckIn[];
};

function ValueBadge({ value }: { value: number }) {
  const color =
    value >= 4 ? "bg-green-100 text-green-700" :
    value === 3 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${color}`}>
      {value}
    </span>
  );
}

export default function CheckInHistory({ checkIns }: Props) {
  if (checkIns.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">
        Aún no hay check-ins registrados.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Últimos 7 días</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b">
              <th className="pb-2 pr-4 font-medium">Fecha</th>
              <th className="pb-2 px-2 font-medium">Energía</th>
              <th className="pb-2 px-2 font-medium">Ánimo</th>
              <th className="pb-2 px-2 font-medium">Estrés</th>
              <th className="pb-2 px-2 font-medium">Sueño</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 pr-4 text-gray-600">
                  {new Date(c.date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="py-2 px-2"><ValueBadge value={c.energy} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.mood} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.stress} /></td>
                <td className="py-2 px-2"><ValueBadge value={c.sleep} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/CheckInHistory.tsx
git commit -m "feat: add CheckInHistory component with color-coded values"
```

---

## Task 4: Página `/checkin` + enlace desde el Dashboard

**Files:**
- Create: `apps/web/app/checkin/page.tsx`
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes: `auth()` de `@/auth`
- Consumes: `prisma.checkIn.findFirst` (check-in de hoy), `prisma.checkIn.findMany` (historial)
- Consumes: `CheckInForm` de `@/components/CheckInForm`
- Consumes: `CheckInHistory` de `@/components/CheckInHistory`
- Produces: página `/checkin` completamente funcional
- Produces: enlace "Check-in de hoy →" en el Dashboard

- [ ] **Step 1: Crear `apps/web/app/checkin/page.tsx`**

```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckInForm from "@/components/CheckInForm";
import CheckInHistory from "@/components/CheckInHistory";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const todayCheckIn = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  });

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">Check-in diario</h1>

      <CheckInForm
        today={
          todayCheckIn
            ? {
                energy: todayCheckIn.energy,
                mood: todayCheckIn.mood,
                stress: todayCheckIn.stress,
                sleep: todayCheckIn.sleep,
              }
            : undefined
        }
      />

      <CheckInHistory checkIns={recentCheckIns} />
    </main>
  );
}
```

- [ ] **Step 2: Agregar enlace al Dashboard en `apps/web/app/page.tsx`**

Reemplazar la línea `<NewAdventureForm />` por:

```typescript
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/checkin"
          className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded"
        >
          Check-in de hoy →
        </Link>
      </div>

      <NewAdventureForm />
```

El import de `Link` ya está en el archivo — no hay que agregarlo.

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Verificar el flujo completo**

Con `npm run dev` corriendo:

1. Dashboard → clic en "Check-in de hoy →" → llega a `/checkin`
2. Los sliders empiezan en 3 (o en los valores de hoy si ya existe un check-in del seed)
3. Mover los sliders → el número se actualiza en vivo
4. Enviar → mensaje "¡Check-in guardado!" y la tabla "Últimos 7 días" se actualiza
5. Enviar de nuevo sin cambiar la página → mensaje "¡Check-in actualizado!" (upsert)
6. Verificar en Prisma Studio que hay exactamente 1 check-in de hoy (no duplicados)
7. "← Volver al Dashboard" regresa a `/`

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/checkin/page.tsx apps/web/app/page.tsx
git commit -m "feat: add check-in page and dashboard link"
```

---

## Checklist de cierre de Fase 6

- [ ] Página `/checkin` carga con sliders pre-populados si ya hay check-in hoy
- [ ] Sliders muestran el valor en vivo (1-5) al moverlos
- [ ] Guardar check-in → mensaje verde "¡Check-in guardado!"
- [ ] Guardar de nuevo el mismo día → mensaje "¡Check-in actualizado!" (no duplica)
- [ ] Tabla "Últimos 7 días" muestra colores: verde ≥4, amarillo =3, rojo ≤2
- [ ] Enlace "Check-in de hoy →" visible en el Dashboard
- [ ] `npx tsc --noEmit` sin errores
- [ ] Actualizar ROADMAP.md marcando los checkboxes de Fase 6
