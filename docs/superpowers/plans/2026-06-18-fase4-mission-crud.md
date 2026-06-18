# Fase 4 — Mission CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la página de detalle de Aventura y el CRUD completo de Misiones, conectado a PostgreSQL via Prisma y Server Actions de Next.js.

**Architecture:** Server Components para lectura directa de Prisma; Server Actions (`"use server"`) para todas las mutaciones; `revalidatePath` para invalidar el caché y refrescar la UI. Sin tests unitarios en esta fase (infraestructura de tests es Fase 11) — la verificación es manual en el navegador.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 7, zod, Tailwind CSS básico.

## Global Constraints

- `params` en páginas dinámicas es `Promise<{ id: string }>` — siempre hacer `await params` antes de usar el id (Next.js 16).
- `"use server"` va en la primera línea del archivo de acciones (no dentro de cada función).
- `revalidatePath` debe incluir la ruta exacta con el id concreto: `revalidatePath(\`/adventures/${id}\`)`.
- `userId: 1` hardcodeado en todas las acciones hasta Fase 5 (auth).
- Tailwind: solo clases básicas de layout, spacing y color — sin diseño final.
- Nombres de variables y funciones en inglés; UI y mensajes de error en español.
- Leer `apps/web/node_modules/next/dist/docs/` antes de tocar APIs de Next.js que no sean del plan.

---

## File Map

| Acción | Archivo |
|---|---|
| Modificar | `apps/web/app/actions/adventures.ts` |
| Crear | `apps/web/app/actions/missions.ts` |
| Modificar | `apps/web/components/AdventureCard.tsx` |
| Crear | `apps/web/app/adventures/[id]/page.tsx` |
| Crear | `apps/web/components/NewMissionForm.tsx` |
| Crear | `apps/web/components/MissionItem.tsx` |
| Crear | `apps/web/components/MissionList.tsx` |

---

## Task 1: Corregir `updateAdventure` y agregar enlace en `AdventureCard`

**Files:**
- Modify: `apps/web/app/actions/adventures.ts`
- Modify: `apps/web/components/AdventureCard.tsx`

**Interfaces:**
- Produces: `updateAdventure` lanza `Error` en vez de retornar silenciosamente cuando los datos son inválidos.
- Produces: `AdventureCard` muestra enlace "Ver misiones →" a `/adventures/[id]`.

- [ ] **Step 1: Corregir `updateAdventure` en `adventures.ts`**

Reemplazar el `if (!result.success) return;` por un throw, y agregar manejo de error en `AdventureCard`.

Abrir `apps/web/app/actions/adventures.ts`. Reemplazar la función `updateAdventure` completa:

```typescript
export async function updateAdventure(formData: FormData): Promise<void> {
  const result = UpdateAdventureSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
  });

  if (!result.success) {
    throw new Error("Datos inválidos al actualizar la aventura");
  }

  await prisma.adventure.update({
    where: { id: result.data.id },
    data: {
      title: result.data.title,
      description: result.data.description,
      status: result.data.status,
    },
  });

  revalidatePath("/");
}
```

- [ ] **Step 2: Actualizar `AdventureCard.tsx` — agregar enlace y manejo de error**

Reemplazar el contenido completo de `apps/web/components/AdventureCard.tsx`:

```typescript
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
```

- [ ] **Step 3: Verificar manualmente**

Correr `npm run dev` desde `apps/web`. Abrir `http://localhost:3000`.
- Confirmar que las tarjetas de aventura muestran el botón "Ver misiones →".
- Confirmar que al hacer clic en "Editar" y guardar, no hay error visible en consola.
- El enlace "Ver misiones →" llevará a un 404 por ahora — es esperado hasta el Task 3.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/actions/adventures.ts apps/web/components/AdventureCard.tsx
git commit -m "fix: update adventure throws on invalid data, add missions link to card"
```

---

## Task 2: Server Actions de Misiones (`missions.ts`)

**Files:**
- Create: `apps/web/app/actions/missions.ts`

**Interfaces:**
- Produces: `createMission(prevState, formData)` → `Promise<ActionState>`
- Produces: `updateMission(formData)` → `Promise<void>`
- Produces: `toggleMission(formData)` → `Promise<void>`
- Produces: `deleteMission(formData)` → `Promise<void>`
- Tipo `ActionState` = `{ errors?: { title?: string[]; difficulty?: string[] }; message?: string }`

- [ ] **Step 1: Crear `apps/web/app/actions/missions.ts`**

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionState = {
  errors?: { title?: string[]; difficulty?: string[] };
  message?: string;
};

const CreateMissionSchema = z.object({
  adventureId: z.coerce.number().int().positive(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3),
});

const UpdateMissionSchema = z.object({
  id: z.coerce.number().int().positive(),
  adventureId: z.coerce.number().int().positive(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3),
});

export async function createMission(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = CreateMissionSchema.safeParse({
    adventureId: formData.get("adventureId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    difficulty: formData.get("difficulty"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await prisma.mission.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
      adventureId: result.data.adventureId,
    },
  });

  revalidatePath(`/adventures/${result.data.adventureId}`);
  return { message: "¡Misión creada!" };
}

export async function updateMission(formData: FormData): Promise<void> {
  const result = UpdateMissionSchema.safeParse({
    id: formData.get("id"),
    adventureId: formData.get("adventureId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    difficulty: formData.get("difficulty"),
  });

  if (!result.success) return;

  await prisma.mission.update({
    where: { id: result.data.id },
    data: {
      title: result.data.title,
      description: result.data.description,
      difficulty: result.data.difficulty,
    },
  });

  revalidatePath(`/adventures/${result.data.adventureId}`);
}

export async function toggleMission(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) return;

  await prisma.mission.update({
    where: { id },
    data: {
      completed: !mission.completed,
      completedAt: !mission.completed ? new Date() : null,
    },
  });

  revalidatePath(`/adventures/${adventureId}`);
}

export async function deleteMission(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const adventureId = Number(formData.get("adventureId"));
  if (!id || !adventureId) return;

  await prisma.mission.delete({ where: { id } });
  revalidatePath(`/adventures/${adventureId}`);
}
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores. Si hay errores, revisar los tipos importados de `@/lib/generated/prisma/client`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/actions/missions.ts
git commit -m "feat: add mission server actions (create, update, toggle, delete)"
```

---

## Task 3: Página de detalle de Aventura

**Files:**
- Create: `apps/web/app/adventures/[id]/page.tsx`

**Interfaces:**
- Consumes: `prisma.adventure.findUnique` con `include: { missions: true }`
- Consumes: `notFound()` de `next/navigation`
- Consumes: `MissionList` (se crea en Task 6, pero la página se conecta en ese task)
- Consumes: `NewMissionForm` (se crea en Task 4, pero la página se conecta en ese task)
- Produces: ruta `/adventures/[id]` accesible desde el navegador

Nota: en Next.js 16, `params` es `Promise<{ id: string }>` — hay que hacer `await params`.

- [ ] **Step 1: Crear el directorio y el archivo de la página**

Crear `apps/web/app/adventures/[id]/page.tsx` con el siguiente contenido:

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventureId = Number(id);

  if (isNaN(adventureId)) notFound();

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: { missions: true },
  });

  if (!adventure) notFound();

  const completedCount = adventure.missions.filter((m) => m.completed).length;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{adventure.title}</h1>
        {adventure.description && (
          <p className="text-gray-600 mt-1">{adventure.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Estado: {adventure.status}</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Misiones ({completedCount}/{adventure.missions.length} completadas)
        </h2>
      </div>

      <p className="text-gray-400 text-sm">
        (Los componentes de misiones se conectan en los siguientes tasks)
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Verificar manualmente**

Con el servidor corriendo, hacer clic en "Ver misiones →" en una tarjeta del Dashboard.
- Esperado: página carga con el título de la aventura, descripción y estado.
- Esperado: enlace "← Volver al Dashboard" funciona.
- Si la URL tiene un id que no existe (ej: `/adventures/9999`), debe mostrar página 404.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/adventures/[id]/page.tsx"
git commit -m "feat: add adventure detail page with dynamic route"
```

---

## Task 4: Componente `NewMissionForm`

**Files:**
- Create: `apps/web/components/NewMissionForm.tsx`

**Interfaces:**
- Consumes: `createMission` de `@/app/actions/missions`
- Consumes: `useActionState` de `react`
- Props: `{ adventureId: number }`
- Produces: formulario que crea una misión y muestra errores inline

- [ ] **Step 1: Crear `apps/web/components/NewMissionForm.tsx`**

```typescript
"use client";

import { useActionState } from "react";
import { createMission } from "@/app/actions/missions";

type Props = {
  adventureId: number;
};

const initialState = {};

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
```

- [ ] **Step 2: Conectar `NewMissionForm` en la página de detalle**

Abrir `apps/web/app/adventures/[id]/page.tsx`. Agregar el import y reemplazar el párrafo placeholder:

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewMissionForm from "@/components/NewMissionForm";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventureId = Number(id);

  if (isNaN(adventureId)) notFound();

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: { missions: true },
  });

  if (!adventure) notFound();

  const completedCount = adventure.missions.filter((m) => m.completed).length;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{adventure.title}</h1>
        {adventure.description && (
          <p className="text-gray-600 mt-1">{adventure.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Estado: {adventure.status}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">
          Misiones ({completedCount}/{adventure.missions.length} completadas)
        </h2>
        <NewMissionForm adventureId={adventure.id} />
        <p className="text-gray-400 text-sm">
          (Lista de misiones se conecta en el siguiente task)
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

En la página de detalle:
- Esperado: formulario "Nueva misión" visible con título, descripción y selector de dificultad.
- Crear una misión con título de 1 carácter → debe mostrar error de validación "al menos 3 caracteres".
- Crear una misión válida → debe mostrar "¡Misión creada!" y la página refrescar.
- Verificar en Prisma Studio (`npx prisma studio`) que la misión aparece en la DB.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/NewMissionForm.tsx "apps/web/app/adventures/[id]/page.tsx"
git commit -m "feat: add NewMissionForm component and connect to detail page"
```

---

## Task 5: Componente `MissionItem`

**Files:**
- Create: `apps/web/components/MissionItem.tsx`

**Interfaces:**
- Consumes: `toggleMission`, `updateMission`, `deleteMission` de `@/app/actions/missions`
- Props: `{ mission: Mission }` donde `Mission` viene de `@/lib/generated/prisma/client`
- Produces: componente que muestra una misión con toggle, edición inline y eliminación

Constante de etiquetas de dificultad (definida dentro del archivo):
```typescript
const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Media",
  3: "Difícil",
};
```

- [ ] **Step 1: Crear `apps/web/components/MissionItem.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Mission } from "@/lib/generated/prisma/client";
import { toggleMission, updateMission, deleteMission } from "@/app/actions/missions";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Media",
  3: "Difícil",
};

type Props = {
  mission: Mission;
};

export default function MissionItem({ mission }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="border rounded p-3 mb-2 bg-white">
        <form
          action={async (formData) => {
            await updateMission(formData);
            setEditing(false);
          }}
        >
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="adventureId" value={mission.adventureId} />
          <div className="flex gap-2 mb-2">
            <input
              name="title"
              defaultValue={mission.title}
              required
              className="border rounded px-2 py-1 flex-1"
            />
            <select
              name="difficulty"
              defaultValue={mission.difficulty}
              className="border rounded px-2 py-1"
            >
              <option value="1">Fácil</option>
              <option value="2">Media</option>
              <option value="3">Difícil</option>
            </select>
          </div>
          <input
            name="description"
            defaultValue={mission.description ?? ""}
            placeholder="Descripción (opcional)"
            className="border rounded px-2 py-1 w-full mb-2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`border rounded p-3 mb-2 bg-white flex items-start gap-3 ${mission.completed ? "opacity-60" : ""}`}>
      <form action={toggleMission} className="mt-0.5">
        <input type="hidden" name="id" value={mission.id} />
        <input type="hidden" name="adventureId" value={mission.adventureId} />
        <button type="submit" className="text-xl leading-none">
          {mission.completed ? "✅" : "⬜"}
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${mission.completed ? "line-through text-gray-400" : ""}`}>
          {mission.title}
        </p>
        {mission.description && (
          <p className={`text-sm text-gray-500 ${mission.completed ? "line-through" : ""}`}>
            {mission.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
            {DIFFICULTY_LABELS[mission.difficulty] ?? "—"}
          </span>
          {mission.completed && mission.completedAt && (
            <span className="text-xs text-gray-400">
              Completada: {new Date(mission.completedAt).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs border px-2 py-1 rounded"
        >
          Editar
        </button>
        <form action={deleteMission}>
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="adventureId" value={mission.adventureId} />
          <button type="submit" className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded">
            Eliminar
          </button>
        </form>
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
git add apps/web/components/MissionItem.tsx
git commit -m "feat: add MissionItem component with toggle, inline edit, and delete"
```

---

## Task 6: Componente `MissionList` y conexión final de la página de detalle

**Files:**
- Create: `apps/web/components/MissionList.tsx`
- Modify: `apps/web/app/adventures/[id]/page.tsx`

**Interfaces:**
- Consumes: `MissionItem` de `@/components/MissionItem`
- Props de `MissionList`: `{ missions: Mission[] }`
- Produces: la página de detalle completamente funcional con lista agrupada

- [ ] **Step 1: Crear `apps/web/components/MissionList.tsx`**

```typescript
import { Mission } from "@/lib/generated/prisma/client";
import MissionItem from "@/components/MissionItem";

type Props = {
  missions: Mission[];
};

export default function MissionList({ missions }: Props) {
  if (missions.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        Aún no hay misiones — ¡agrega la primera arriba!
      </p>
    );
  }

  const pending = missions.filter((m) => !m.completed);
  const completed = missions.filter((m) => m.completed);

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Pendientes ({pending.length})
          </h3>
          {pending.map((mission) => (
            <MissionItem key={mission.id} mission={mission} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Completadas ({completed.length})
          </h3>
          {completed.map((mission) => (
            <MissionItem key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Conectar `MissionList` en la página de detalle (versión final)**

Reemplazar el contenido completo de `apps/web/app/adventures/[id]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewMissionForm from "@/components/NewMissionForm";
import MissionList from "@/components/MissionList";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventureId = Number(id);

  if (isNaN(adventureId)) notFound();

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: {
      missions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!adventure) notFound();

  const completedCount = adventure.missions.filter((m) => m.completed).length;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{adventure.title}</h1>
        {adventure.description && (
          <p className="text-gray-600 mt-1">{adventure.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Estado: {adventure.status}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">
          Misiones ({completedCount}/{adventure.missions.length} completadas)
        </h2>
        <NewMissionForm adventureId={adventure.id} />
        <MissionList missions={adventure.missions} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verificar el flujo completo**

Con `npm run dev` corriendo, hacer el siguiente recorrido completo:

1. Dashboard → ver tarjetas de aventura con botón "Ver misiones →"
2. Clic en "Ver misiones →" → llega a `/adventures/[id]`
3. Crear una misión con dificultad "Media" → aparece en "Pendientes"
4. Marcar misión como completada → se mueve a "Completadas" con fecha
5. Desmarcar misión → vuelve a "Pendientes" sin fecha
6. Editar misión → cambiar título y dificultad → confirmar cambios
7. Eliminar misión → desaparece de la lista
8. Crear misión con título de 2 caracteres → error de validación visible
9. "← Volver al Dashboard" → regresa a `/`

- [ ] **Step 4: Verificar TypeScript final**

```bash
cd apps/web && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 5: Commit final**

```bash
git add apps/web/components/MissionList.tsx "apps/web/app/adventures/[id]/page.tsx"
git commit -m "feat: complete Fase 4 — mission list and detail page wired up"
```

---

## Checklist de cierre de Fase 4

Al terminar los 6 tasks, confirmar que todo funciona:

- [ ] Dashboard muestra aventuras reales de la DB
- [ ] Crear / editar / eliminar Aventura funciona desde el Dashboard
- [ ] "Ver misiones →" navega a `/adventures/[id]`
- [ ] Crear misión con validación de título y selector de dificultad
- [ ] Toggle de misión (completa / pendiente) con `completedAt`
- [ ] Editar misión inline
- [ ] Eliminar misión
- [ ] `npx tsc --noEmit` sin errores
- [ ] Actualizar ROADMAP.md marcando los checkboxes de Fase 4 como completados
