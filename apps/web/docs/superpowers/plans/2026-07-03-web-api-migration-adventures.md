# Web API Migration — Adventures + Missions (`/` and `/adventures/[id]`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the dashboard (`/`) and adventure detail (`/adventures/[id]`) pages from Server Actions + direct Prisma reads to the `/api/mobile/*` JSON API, the same pattern established for `/checkin`.

**Architecture:** These two pages share the adventures/missions resource and its Server Actions, so they're migrated together — migrating one and not the other would leave two live paths into the same data, contradicting the whole point of this initiative. `/adventures/[id]` goes first (smaller, self-contained — just mission CRUD against one adventure). The dashboard goes second and is the largest slice: it owns adventures+missions, today's check-in, streak, and recommendations, and pulls in the check-ins API endpoints already built for `/checkin`. Both pages move their entire interactive layout (nav rail included) into a client component that fetches its own data — `page.tsx` shrinks to the auth check plus server-only values (timezone-derived theme) that don't need Prisma.

**Tech Stack:** Next.js 16 (App Router, Client Components, `fetch`), TypeScript, the mobile API built in `2026-07-01-mobile-api.md` and extended in `2026-07-03-web-api-migration-checkin.md`.

**Spec:** `apps/web/docs/superpowers/specs/2026-07-02-web-api-migration-design.md`

## Global Constraints

- Zero visual/behavioral change to the end user, except: (a) new loading/error states where SSR data used to be ready instantly, and (b) the recommendations "no todayCheckIn" / "service unavailable" / "empty" cases collapse from a `null`-vs-object distinction into a single always-present `{ recommendations, message }` shape — UI still only renders the recommendations block when `todayCheckIn` exists, so the end result looks identical (see Task 3 Step 4 for the exact reasoning).
- Run all commands from `apps/web/`.
- No new automated test framework — verification is `tsc`, manual curl, and manual browser checks.
- Error responses keep the shape `{ "error": { "code": "...", "message": "..." } }`. The mobile API returns one general `message` string for validation errors, not per-field errors like the old Server Actions' zod `.flatten().fieldErrors` — where old UI showed a per-field message, show the API's single message in that same visual slot instead (this is a deliberate, minor adaptation, not a bug).
- `app/actions/adventures.ts` and `app/actions/missions.ts` are NOT deleted in this plan — `MissionItem.tsx`/`NewMissionForm.tsx` (Task 2) and `DashboardBody.tsx`/`NewAdventurePanel.tsx`/`AdventureEditorModal.tsx`/`MissionEditorModal.tsx` (Task 3) all stop importing them by the end of Task 3; Task 4 deletes both files plus the confirmed-dead `components/NewAdventureForm.tsx`.
- `components/AdventureCard.tsx` is confirmed dead code (unreferenced by any live page) — out of scope for this plan, not touched.

---

### Task 1: Extend the adventures list API to include full missions

**Files:**
- Modify: `apps/web/lib/services/adventures.ts`
- Modify: `apps/web/app/api/mobile/adventures/route.ts`

**Interfaces:**
- Produces: `listAdventuresWithMissions(userId: number): Promise<AdventureDetail[]>` (new service function). `GET /api/mobile/adventures?include=missions` → `AdventureDetail[]` (full missions per adventure). `GET /api/mobile/adventures` (no param) is unchanged — still `AdventureSummary[]` (counts only).
- Consumed by: Task 3 (dashboard needs full missions per adventure to render mission lists, compute progress, and find the "next mission").

- [ ] **Step 1: Add `listAdventuresWithMissions` to the service**

In `apps/web/lib/services/adventures.ts`, add this function immediately after `listAdventures` (leave everything else in the file unchanged):

```ts
export async function listAdventuresWithMissions(userId: number): Promise<AdventureDetail[]> {
  const adventures = await prisma.adventure.findMany({
    where: { userId },
    include: { missions: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return adventures.map(toDetail);
}
```

- [ ] **Step 2: Wire `?include=missions` into the GET route**

Replace the `GET` handler in `apps/web/app/api/mobile/adventures/route.ts`:

```ts
// app/api/mobile/adventures/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { listAdventures, listAdventuresWithMissions, createAdventure } from "@/lib/services/adventures";

const CreateAdventureSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  paletteIdx: z.number().int().min(0).max(4).default(0),
  initialMissions: z
    .array(z.object({ title: z.string().min(1), difficulty: z.number().int().min(1).max(3) }))
    .optional(),
});

export const GET = withMobileAuth(async (req: NextRequest, { userId }) => {
  const includeMissions = req.nextUrl.searchParams.get("include") === "missions";
  const adventures = includeMissions
    ? await listAdventuresWithMissions(userId)
    : await listAdventures(userId);
  return apiSuccess(adventures);
});

export const POST = withMobileAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json().catch(() => null);
  const result = CreateAdventureSchema.safeParse(body);

  if (!result.success) {
    return apiError(400, "validation_error", result.error.issues[0]?.message ?? "Datos inválidos");
  }

  const adventure = await createAdventure(userId, result.data);
  return apiSuccess(adventure, 201);
});
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Verify with curl**

```bash
curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jose@aventuras.com","password":"aventuras123"}'
```

Copy the `accessToken`, then:

```bash
curl -s "http://localhost:3000/api/mobile/adventures?include=missions" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: `200` with a JSON array where each adventure object has a `missions` array (each mission with `id`, `title`, `difficulty`, `completed`, etc.).

```bash
curl -s "http://localhost:3000/api/mobile/adventures" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: `200` with the same array shape as before this change (no `missions` field) — confirms the default behavior is unchanged.

- [ ] **Step 5: Commit**

```bash
git add lib/services/adventures.ts app/api/mobile/adventures/route.ts
git commit -m "feat(web-api-migration): add ?include=missions to the adventures list API"
```

---

### Task 2: Migrate `/adventures/[id]` to fetch-based data loading and mutations

**Files:**
- Modify: `apps/web/app/adventures/[id]/page.tsx`
- Create: `apps/web/components/AdventureDetailBody.tsx`
- Modify: `apps/web/components/MissionItem.tsx`
- Modify: `apps/web/components/NewMissionForm.tsx`
- Modify: `apps/web/components/MissionList.tsx`

**Interfaces:**
- Consumes: `GET /api/mobile/adventures/:id` (existing, returns `AdventureDetail` with `missions`), `POST /api/mobile/adventures/:id/missions`, `PATCH /api/mobile/missions/:id` (existing, supports `{title,description,difficulty}` or `{completed}`), `DELETE /api/mobile/missions/:id` (all existing from `mobile-api`, unchanged by this plan).
- Produces: `MissionItem`, `NewMissionForm`, and `MissionList` all gain an `onChanged: () => void` callback prop, called after any successful mutation so `AdventureDetailBody` can refetch.

- [ ] **Step 1: Slim down `app/adventures/[id]/page.tsx`**

Replace the entire file:

```tsx
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getMoment } from "@/lib/theme";
import AdventureDetailBody from "@/components/AdventureDetailBody";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const adventureId = Number(id);
  if (isNaN(adventureId)) notFound();

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10,
  );
  const theme = getMoment(localHour);

  return <AdventureDetailBody adventureId={adventureId} momentKey={theme.key} />;
}
```

Note: the `isNaN(adventureId)` case (a malformed URL) still calls Next's real `notFound()` server-side, same as before. Only the "valid ID but no matching adventure" case (which requires a DB lookup) moves client-side — see Step 2.

- [ ] **Step 2: Create `components/AdventureDetailBody.tsx`**

This is the full page layout (nav rail, header card, missions section, bottom nav) moved out of the old `page.tsx`, now a client component that fetches its own data:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThreeBackground from "@/components/background/ThreeBackground";
import NewMissionForm from "@/components/NewMissionForm";
import MissionList from "@/components/MissionList";
import type { MomentKey } from "@/lib/theme";
import type { Mission } from "@/lib/generated/prisma/client";

type AdventureDetail = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  paletteIdx: number;
  createdAt: string;
  missions: Mission[];
};

type Props = { adventureId: number; momentKey: MomentKey };
type LoadState = "loading" | "ready" | "not-found" | "error";

export default function AdventureDetailBody({ adventureId, momentKey }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventure, setAdventure] = useState<AdventureDetail | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/mobile/adventures/${adventureId}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 404) {
        setLoadState("not-found");
        return;
      }
      if (!res.ok) throw new Error("load_failed");
      setAdventure(await res.json());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [adventureId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadState === "loading") {
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A8FA0" }}>
        <ThreeBackground moment={momentKey} />
        <div style={{ position: "relative", zIndex: 1 }}>Cargando aventura…</div>
      </div>
    );
  }

  if (loadState === "not-found" || loadState === "error") {
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#7A8FA0" }}>
        <ThreeBackground moment={momentKey} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {loadState === "not-found" ? "Aventura no encontrada." : "No se pudo cargar la aventura."}
        </div>
        <Link href="/" style={{ position: "relative", zIndex: 1, color: "#7EB8D8", textDecoration: "none" }}>
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  const adv = adventure!;
  const completedCount = adv.missions.filter((m) => m.completed).length;
  const pct = adv.missions.length === 0 ? 0 : Math.round((completedCount / adv.missions.length) * 100);

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", fontFamily: "var(--font-hanken), sans-serif" }}>
      <ThreeBackground moment={momentKey} />

      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>

        {/* Nav rail */}
        <nav className="av-nav-rail" style={{
          flexShrink: 0, width: 84,
          background: "rgba(10,15,26,.66)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(236,230,216,.1)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "22px 0",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "radial-gradient(circle at 60% 35%, #F0EAD8, #9DB6A4)",
            boxShadow: "0 0 18px rgba(240,234,216,.3)",
            marginBottom: 24, flexShrink: 0,
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {[
              { icon: "⛰", label: "Aventuras", href: "/",         active: true  },
              { icon: "♡", label: "Check-in",  href: "/checkin",  active: false },
              { icon: "◷", label: "Progreso",  href: "/progress", active: false },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 15,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4,
                  ...(item.active
                    ? { background: "rgba(91,155,209,.2)", border: "1px solid rgba(146,199,230,.45)", color: "#CDE6F5" }
                    : { color: "#9FB4C6" }),
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Scrollable content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "28px 28px 64px" }}>

          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#7A8FA0", textDecoration: "none", marginBottom: 22,
          }}>
            ← Volver al dashboard
          </Link>

          {/* Adventure header */}
          <div style={{
            background: "rgba(14,20,36,.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(236,230,216,.14)",
            borderRadius: 24,
            padding: "28px 28px 22px",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
              <h1 style={{
                fontFamily: "var(--font-schibsted)",
                fontWeight: 700, fontSize: 22, color: "#F2EFE6", lineHeight: 1.25, margin: 0,
              }}>
                {adv.title}
              </h1>
              <span style={{
                flexShrink: 0,
                background: "rgba(126,154,134,.12)",
                border: "1px solid rgba(126,154,134,.3)",
                borderRadius: 12,
                padding: "5px 13px",
                fontSize: 13, fontWeight: 700, color: "#7E9A86",
              }}>
                {pct}%
              </span>
            </div>

            {adv.description && (
              <p style={{ fontSize: 14, color: "#7A8FA0", lineHeight: 1.55, marginBottom: 16 }}>
                {adv.description}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 5, background: "rgba(236,230,216,.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 5,
                  background: "linear-gradient(90deg,#7E9A8699,#7E9A86)",
                  width: `${pct}%`,
                  transition: "width .5s cubic-bezier(.2,0,0,1)",
                }} />
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, color: "#5A6A78" }}>
                {completedCount} / {adv.missions.length} misiones
              </span>
            </div>
          </div>

          {/* Missions */}
          <div style={{
            background: "rgba(14,20,36,.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(236,230,216,.12)",
            borderRadius: 20,
            padding: "22px 24px",
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: ".09em",
              textTransform: "uppercase", color: "#4E6070", marginBottom: 18,
            }}>
              Misiones
            </p>
            <NewMissionForm adventureId={adv.id} onCreated={load} />
            <MissionList missions={adv.missions} onChanged={load} />
          </div>

        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="av-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,15,26,.88)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(236,230,216,.1)",
        padding: "10px 0 16px",
        justifyContent: "space-around", alignItems: "center",
        zIndex: 60,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#CDE6F5" }}>
          <span style={{ fontSize: 22 }}>⛰</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Aventuras</span>
        </Link>
        <Link href="/checkin" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>♡</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Check-in</span>
        </Link>
        <Link href="/progress" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#9FB4C6" }}>
          <span style={{ fontSize: 22 }}>◷</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>Progreso</span>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `NewMissionForm.tsx` to fetch-based creation**

Replace the entire file:

```tsx
"use client";

import { useState } from "react";

type SaveState = { status: "idle" | "saving" | "error"; error?: string };

type Props = {
  adventureId: number;
  onCreated: () => void;
};

export default function NewMissionForm({ adventureId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch(`/api/mobile/adventures/${adventureId}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, difficulty }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo crear la misión." });
        return;
      }
      setTitle("");
      setDescription("");
      setDifficulty(1);
      setSaveState({ status: "idle" });
      onCreated();
    } catch {
      setSaveState({ status: "error", error: "No se pudo crear la misión." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 bg-gray-50">
      <h3 className="font-medium mb-3">Nueva misión</h3>

      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la misión"
          required
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="mb-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="mb-3">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="1">Fácil</option>
          <option value="2">Media</option>
          <option value="3">Difícil</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saveState.status === "saving"}
        className="bg-indigo-500 text-white px-4 py-1 rounded disabled:opacity-50"
      >
        {saveState.status === "saving" ? "Agregando..." : "Agregar misión"}
      </button>

      {saveState.status === "error" && (
        <p className="text-red-500 text-sm mt-2">{saveState.error}</p>
      )}
    </form>
  );
}
```

Note: field-level `state.errors?.title` display is replaced by a single error message in the same visual slot (below the button), per the Global Constraints note on validation error shape.

- [ ] **Step 4: Update `MissionList.tsx` to pass through the new callback**

Replace the entire file:

```tsx
import { Mission } from "@/lib/generated/prisma/client";
import MissionItem from "@/components/MissionItem";

type Props = {
  missions: Mission[];
  onChanged: () => void;
};

export default function MissionList({ missions, onChanged }: Props) {
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
            <MissionItem key={mission.id} mission={mission} onChanged={onChanged} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Completadas ({completed.length})
          </h3>
          {completed.map((mission) => (
            <MissionItem key={mission.id} mission={mission} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update `MissionItem.tsx` to fetch-based toggle/update/delete**

Replace the entire file:

```tsx
"use client";

import { useState } from "react";
import { Mission } from "@/lib/generated/prisma/client";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fácil",
  2: "Media",
  3: "Difícil",
};

type Props = {
  mission: Mission;
  onChanged: () => void;
};

export default function MissionItem({ mission, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchMission(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/mobile/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return false;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        setError(errBody?.error?.message ?? "No se pudo guardar la misión.");
        return false;
      }
      setError(null);
      onChanged();
      return true;
    } catch {
      setError("No se pudo guardar la misión.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    await patchMission({ completed: !mission.completed });
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    const difficulty = Number((form.elements.namedItem("difficulty") as HTMLSelectElement).value);
    const ok = await patchMission({ title, description: description || undefined, difficulty });
    if (ok) setEditing(false);
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/mobile/missions/${mission.id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        setError(errBody?.error?.message ?? "No se pudo eliminar la misión.");
        return;
      }
      onChanged();
    } catch {
      setError("No se pudo eliminar la misión.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="border rounded p-3 mb-2 bg-white">
        <form onSubmit={handleSaveEdit}>
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
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(null); }}
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
      <button onClick={handleToggle} disabled={busy} className="text-xl leading-none mt-0.5">
        {mission.completed ? "✅" : "⬜"}
      </button>

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
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs border px-2 py-1 rounded"
        >
          Editar
        </button>
        <button onClick={handleDelete} disabled={busy} className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded disabled:opacity-50">
          Eliminar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Manual browser verification**

1. Navigate to a valid `/adventures/:id` URL (pick a real ID from your dashboard). Expected: brief "Cargando aventura…" then the adventure detail renders with its missions.
2. Add a mission via the form. Expected: it appears in the "Pendientes" list without a full page reload.
3. Toggle a mission's checkbox. Expected: it moves between "Pendientes"/"Completadas".
4. Edit a mission's title. Expected: updates in place.
5. Delete a mission. Expected: it disappears from the list.
6. Navigate to `/adventures/999999` (a non-existent ID). Expected: "Aventura no encontrada." with a link back to the dashboard.

- [ ] **Step 8: Commit**

```bash
git add app/adventures/\[id\]/page.tsx components/AdventureDetailBody.tsx components/MissionItem.tsx components/NewMissionForm.tsx components/MissionList.tsx
git commit -m "feat(web-api-migration): migrate /adventures/[id] to fetch-based loading and mutations"
```

---

### Task 3: Migrate `/` (dashboard) to fetch-based data loading and mutations

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/components/DashboardBody.tsx`
- Modify: `apps/web/components/NewAdventurePanel.tsx`
- Modify: `apps/web/components/AdventureEditorModal.tsx`
- Modify: `apps/web/components/MissionEditorModal.tsx`

**Interfaces:**
- Consumes: `GET /api/mobile/adventures?include=missions` (Task 1), `GET /api/mobile/checkins?today=true`, `GET /api/mobile/checkins?limit=30` (both existing from the `/checkin` migration, unchanged), `GET /api/mobile/recommendations` (existing, unchanged), `POST /api/mobile/adventures`, `PATCH`/`DELETE /api/mobile/adventures/:id`, `POST /api/mobile/adventures/:id/missions`, `PATCH`/`DELETE /api/mobile/missions/:id` (all existing).
- Produces: `NewAdventurePanel`, `AdventureEditorModal`, `MissionEditorModal` all gain an `onSaved: () => void` (or reuse existing `onDeleted`) callback, called after a successful mutation so `DashboardBody` can refetch its adventures list.

- [ ] **Step 1: Slim down `app/page.tsx`**

Replace the entire file:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import DashboardBody from "@/components/DashboardBody";
import { getMoment } from "@/lib/theme";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initial = (session.user.name?.[0] ?? "?").toUpperCase();

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  const theme = getMoment(localHour);

  return <DashboardBody theme={theme} firstName={firstName ?? ""} initial={initial} />;
}
```

Note: `theme` here is the full `MomentTheme` object (not just the key) — unlike `/adventures/[id]`, `DashboardBody` already uses many of `theme`'s color fields (`theme.glassBg`, `theme.cardInk`, etc.) throughout its existing JSX, so the whole object is passed through, same as before this migration.

- [ ] **Step 2: Rewrite `DashboardBody.tsx`'s data layer**

`DashboardBody.tsx` keeps essentially all of its existing JSX (the two-column layout, the mission cards, the modals) — this step only replaces the top of the file (imports, props, state, data fetching) and the two inline mission-toggle forms. The rest of the render output is unchanged.

Replace the file's imports and props/type declarations (everything from the top of the file down to, but not including, the `export default function DashboardBody` line) with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NewAdventurePanel from "./NewAdventurePanel";
import MissionEditorModal, { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";
import AdventureEditorModal from "./AdventureEditorModal";
import { MomentTheme } from "@/lib/theme";
import { PALETTES } from "@/lib/palettes";
import type { Adventure, Mission } from "@/lib/generated/prisma/client";

type AdventureWithMissions = Adventure & { missions: Mission[] };
type Rec = { id: number; title: string; reason: string };
type RecsResult = { recommendations: Rec[]; message: string };

const DIM = "rgba(236,230,216,.18)";

const FILTER_CHIPS: { key: "all" | "active" | "done"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "En curso" },
  { key: "done", label: "Listas" },
];

const LEVELS = [
  { name: "Caminante",  min: 0,    max: 99,    color: "#7E9A86" },
  { name: "Explorador", min: 100,  max: 249,   color: "#5B9BD1" },
  { name: "Aventurero", min: 250,  max: 499,   color: "#9B7ED1" },
  { name: "Héroe",      min: 500,  max: 999,   color: "#E3A878" },
  { name: "Leyenda",    min: 1000, max: 99999, color: "#E36878" },
];

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid rgba(236,230,216,.3)",
  borderRadius: 10, padding: "9px 12px", fontSize: 13,
  color: "#2A332D", outline: "none",
  background: "rgba(251,248,241,.9)", width: "100%", boxSizing: "border-box",
};

type WeekDay = { done: boolean; label: string; isToday: boolean };
type CheckInValues = { energy: number; mood: number; stress: number; sleep: number };

type Props = {
  theme: MomentTheme;
  firstName: string;
  initial: string;
};

type EditorTarget = { adventureId: number; mission: Mission | null };
type LoadState = "loading" | "ready" | "error";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const;
```

Then replace the component signature and its data-loading logic. Find:

```tsx
export default function DashboardBody({ adventures, todayCheckIn, recommendations, theme, firstName, streak, doneMissions, totalMissions, weekDays }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fadeTick, setFadeTick] = useState(0);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [showAdvModal, setShowAdvModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "done">("all");
```

Replace with:

```tsx
export default function DashboardBody({ theme, firstName, initial }: Props) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventures, setAdventures] = useState<AdventureWithMissions[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckInValues | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [recommendations, setRecommendations] = useState<RecsResult | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fadeTick, setFadeTick] = useState(0);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [showAdvModal, setShowAdvModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "done">("all");

  const refresh = useCallback(async () => {
    try {
      const [advRes, todayRes, historyRes, recsRes] = await Promise.all([
        fetch("/api/mobile/adventures?include=missions"),
        fetch("/api/mobile/checkins?today=true"),
        fetch("/api/mobile/checkins?limit=30"),
        fetch("/api/mobile/recommendations"),
      ]);

      if ([advRes, todayRes, historyRes, recsRes].some((r) => r.status === 401)) {
        window.location.href = "/login";
        return;
      }
      if (!advRes.ok || !todayRes.ok || !historyRes.ok || !recsRes.ok) {
        throw new Error("load_failed");
      }

      setAdventures(await advRes.json());

      const todayData: { checkIn: CheckInValues | null } = await todayRes.json();
      setTodayCheckIn(todayData.checkIn);

      const history: { date: string }[] = await historyRes.json();
      const ciDays = new Set(
        history.map((ci) => {
          const d = new Date(ci.date);
          return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        })
      );
      let s = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        if (ciDays.has(key)) {
          s++;
        } else if (i === 0) {
          continue;
        } else {
          break;
        }
      }
      setStreak(s);

      setWeekDays(Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - (6 - i));
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        return { done: ciDays.has(key), label: DAY_LABELS[d.getUTCDay()], isToday: i === 6 };
      }));

      setRecommendations(await recsRes.json());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const doneMissions = adventures
    .filter((a) => a.status !== "completed")
    .reduce((sum, a) => sum + a.missions.filter((m) => m.completed).length, 0);
  const totalMissions = adventures
    .filter((a) => a.status !== "completed")
    .reduce((sum, a) => sum + a.missions.length, 0);
```

Note: `doneMissions`/`totalMissions` move from server-computed props to client-computed derived values (same formula, moved). `refresh` is deliberately fetched fully in parallel (`Promise.all` of 4 endpoints) rather than the original's implicit sequential server-side awaits — this doesn't change what the user sees, only how fast it loads.

Now, immediately after the `if (activeAdventures.length === 0...` — actually, before the existing `return (` that starts the main JSX, add the loading/error early-return (insert this right after the `levelPct` calculation, before `return (`):

```tsx
  if (loadState === "loading" || loadState === "error") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: theme.cardSub, fontSize: 15 }}>
        {loadState === "loading" ? "Cargando tu dashboard…" : "No se pudo cargar el dashboard. Intenta recargar la página."}
      </div>
    );
  }
```

- [ ] **Step 3: Update the two inline mission-toggle forms**

Find (inside the "ESTADO MISIONES" section, the per-mission toggle button):

```tsx
                          {/* Toggle button */}
                          <form action={toggleMission} style={{ flexShrink: 0 }}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="adventureId" value={selected.id} />
                            <button type="submit" style={{
```

Replace with:

```tsx
                          {/* Toggle button */}
                          <button
                            onClick={async () => {
                              await fetch(`/api/mobile/missions/${m.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ completed: !m.completed }),
                              });
                              refresh();
                            }}
                            style={{
```

And close the replaced block: find the matching `</button>\n                          </form>` right after (the closing tags for that same toggle button) and replace with just `</button>` (drop the `</form>`).

Find the second toggle form (the "Completar misión de hoy" CTA button):

```tsx
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                  <form action={toggleMission}>
                    <input type="hidden" name="id" value={selected.missions.find((m) => !m.completed)?.id ?? ""} />
                    <input type="hidden" name="adventureId" value={selected.id} />
                    <button
                      type="submit"
                      disabled={!selected.missions.find((m) => !m.completed)}
                      style={{
```

Replace with:

```tsx
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                    <button
                      onClick={async () => {
                        const next = selected.missions.find((m) => !m.completed);
                        if (!next) return;
                        await fetch(`/api/mobile/missions/${next.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ completed: true }),
                        });
                        refresh();
                      }}
                      disabled={!selected.missions.find((m) => !m.completed)}
                      style={{
```

Find its matching closing `</form>` right after that button's closing `</button>` and remove it (keep only `</button>`).

- [ ] **Step 4: Update the recommendations JSX**

Find:

```tsx
                {/* Recomendaciones */}
                {todayCheckIn && recommendations && recommendations.recommendations.length > 0 && (
```

This condition is unchanged — `recommendations` is now always an object once loaded (never `null` after a successful fetch, matching the API's always-present `{recommendations, message}` shape), so `recommendations &&` is now always true post-load but harmless to leave (guards the brief window before the initial fetch resolves, though the loading-state early-return already covers that). Leave this block as-is.

Find:

```tsx
                {todayCheckIn && !recommendations && (
                  <div style={{ fontSize: 13, color: theme.cardSub, lineHeight: 1.5, marginBottom: 14 }}>
                    Check-in registrado ✓ — Las recomendaciones no están disponibles en este momento.
                  </div>
                )}
```

Replace with:

```tsx
                {todayCheckIn && recommendations && recommendations.recommendations.length === 0 && (
                  <div style={{ fontSize: 13, color: theme.cardSub, lineHeight: 1.5, marginBottom: 14 }}>
                    {recommendations.message}
                  </div>
                )}
```

This now shows whatever message the API sent for the empty case (service down, or genuinely no recommendations) instead of a hardcoded string — the API already sends an appropriate Spanish message for both cases (see `app/api/mobile/recommendations/route.ts`).

- [ ] **Step 5: Wire `refresh` into `NewAdventurePanel`, `AdventureEditorModal`, `MissionEditorModal`**

Find:

```tsx
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                  <NewAdventurePanel fullWidth />
                </div>
```

Replace with:

```tsx
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(236,230,216,.1)" }}>
                  <NewAdventurePanel fullWidth onCreated={refresh} />
                </div>
```

Find:

```tsx
                {showAdvModal && (
                  <AdventureEditorModal
                    adventure={selected}
                    onClose={() => setShowAdvModal(false)}
                    onDeleted={() => { setShowAdvModal(false); setSelectedId(null); setFadeTick(t => t + 1); }}
                  />
                )}
```

Replace with:

```tsx
                {showAdvModal && (
                  <AdventureEditorModal
                    adventure={selected}
                    onClose={() => setShowAdvModal(false)}
                    onSaved={refresh}
                    onDeleted={() => { setShowAdvModal(false); setSelectedId(null); setFadeTick(t => t + 1); refresh(); }}
                  />
                )}
```

Find:

```tsx
      {editorTarget && (
        <MissionEditorModal
          adventureId={editorTarget.adventureId}
          mission={editorTarget.mission}
          onClose={() => setEditorTarget(null)}
        />
      )}
```

Replace with:

```tsx
      {editorTarget && (
        <MissionEditorModal
          adventureId={editorTarget.adventureId}
          mission={editorTarget.mission}
          onClose={() => setEditorTarget(null)}
          onSaved={refresh}
        />
      )}
```

- [ ] **Step 6: Rewrite `NewAdventurePanel.tsx`'s submission**

Replace the file's imports and the `Props`/state-hook lines:

```tsx
// Change:
// import { useState, useActionState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import { createAdventure } from "@/app/actions/adventures";
// import { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";
// import { PALETTES } from "@/lib/palettes";
//
// type Props = { fullWidth?: boolean };
//
// export default function NewAdventurePanel({ fullWidth }: Props) {
//   const [open, setOpen] = useState(false);
//   const [draftTitle, setDraftTitle] = useState("");
//   const [draftGradIdx, setDraftGradIdx] = useState(0);
//   const [draftMissions, setDraftMissions] = useState<{ name: string; diff: number }[]>([]);
//   const [missionInput, setMissionInput] = useState("");
//   const [draftMissionLevel, setDraftMissionLevel] = useState(2);
//
//   const [state, formAction, pending] = useActionState(createAdventure, {});
//
//   useEffect(() => {
//     if (state.message) {
//       setOpen(false);
//       setDraftTitle("");
//       setDraftGradIdx(0);
//       setDraftMissions([]);
//       setMissionInput("");
//       setDraftMissionLevel(2);
//     }
//   }, [state.message]);
// to:
import { useState } from "react";
import { createPortal } from "react-dom";
import { MISSION_LEVELS, hexToRgb } from "./MissionEditorModal";
import { PALETTES } from "@/lib/palettes";

type Props = { fullWidth?: boolean; onCreated: () => void };
type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function NewAdventurePanel({ fullWidth, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGradIdx, setDraftGradIdx] = useState(0);
  const [draftMissions, setDraftMissions] = useState<{ name: string; diff: number }[]>([]);
  const [missionInput, setMissionInput] = useState("");
  const [draftMissionLevel, setDraftMissionLevel] = useState(2);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/mobile/adventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          paletteIdx: draftGradIdx,
          initialMissions: draftMissions.map((m) => ({ title: m.name, difficulty: m.diff })),
        }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo crear la aventura." });
        return;
      }
      setOpen(false);
      setDraftTitle("");
      setDraftGradIdx(0);
      setDraftMissions([]);
      setMissionInput("");
      setDraftMissionLevel(2);
      setSaveState({ status: "idle" });
      onCreated();
    } catch {
      setSaveState({ status: "error", error: "No se pudo crear la aventura." });
    }
  }
```

Then, within the JSX, find:

```tsx
            <form
              action={formAction}
              style={{
```

Replace with:

```tsx
            <form
              onSubmit={handleSubmit}
              style={{
```

Find:

```tsx
                {state.errors?.title && (
                  <p style={{ color: "#C97B7B", fontSize: 13, margin: "-10px 0 12px" }}>{state.errors.title[0]}</p>
                )}
```

Replace with:

```tsx
                {saveState.status === "error" && (
                  <p style={{ color: "#C97B7B", fontSize: 13, margin: "-10px 0 12px" }}>{saveState.error}</p>
                )}
```

Find:

```tsx
                    disabled={!canCreate || pending}
```

Replace with:

```tsx
                    disabled={!canCreate || saveState.status === "saving"}
```

Find:

```tsx
                    {pending ? "Creando..." : "Crear aventura"}
```

Replace with:

```tsx
                    {saveState.status === "saving" ? "Creando..." : "Crear aventura"}
```

Note: the `initialMission`/`initialMissionDiff` hidden `<input>` pairs inside the scrollable missions list are no longer needed (they existed to feed `FormData`, but `handleSubmit` reads `draftMissions` directly from React state) — they can stay harmlessly unused in the DOM, but for cleanliness, find and remove these two lines from that block:

```tsx
                        <input type="hidden" name="initialMission" value={m.name} />
                        <input type="hidden" name="initialMissionDiff" value={m.diff} />
```

And the top-level hidden palette input, find and remove:

```tsx
                <input type="hidden" name="paletteIdx" value={draftGradIdx} />
```

- [ ] **Step 7: Rewrite `AdventureEditorModal.tsx`'s save/delete**

Replace:

```tsx
// import { updateAdventure, deleteAdventure } from "@/app/actions/adventures";
```

with nothing (remove the import; no replacement needed since `fetch` is used directly).

Find:

```tsx
type Props = {
  adventure: AdventureWithMissions;
  onClose: () => void;
  onDeleted: () => void;
};

export default function AdventureEditorModal({ adventure, onClose, onDeleted }: Props) {
  const [title, setTitle] = useState(adventure.title);
  const [description, setDescription] = useState(adventure.description ?? "");
  const [paletteIdx, setPaletteIdx] = useState(adventure.paletteIdx ?? 0);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const canSave = title.trim().length >= 3;

  function handleSave() {
    if (!canSave) return;
    const fd = new FormData();
    fd.set("id", String(adventure.id));
    fd.set("title", title.trim());
    fd.set("description", description);
    fd.set("status", adventure.status ?? "active");
    fd.set("paletteIdx", String(paletteIdx));
    startSave(async () => {
      await updateAdventure(fd);
      onClose();
    });
  }

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(adventure.id));
    startDelete(async () => {
      await deleteAdventure(fd);
      onDeleted();
    });
  }
```

Replace with:

```tsx
type Props = {
  adventure: AdventureWithMissions;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

export default function AdventureEditorModal({ adventure, onClose, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState(adventure.title);
  const [description, setDescription] = useState(adventure.description ?? "");
  const [paletteIdx, setPaletteIdx] = useState(adventure.paletteIdx ?? 0);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = title.trim().length >= 3;

  function handleSave() {
    if (!canSave) return;
    startSave(async () => {
      setSaveError(null);
      const res = await fetch(`/api/mobile/adventures/${adventure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          status: adventure.status ?? "active",
          paletteIdx,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError(body?.error?.message ?? "No se pudo guardar la aventura.");
        return;
      }
      onSaved();
      onClose();
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await fetch(`/api/mobile/adventures/${adventure.id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      onDeleted();
    });
  }
```

Find (in the JSX, near the bottom):

```tsx
          {/* Acciones */}
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
```

Replace with:

```tsx
          {saveError && (
            <p style={{ color: "#D89C92", fontSize: 13, marginBottom: 14 }}>{saveError}</p>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
```

- [ ] **Step 8: Rewrite `MissionEditorModal.tsx`'s save/delete**

Replace:

```tsx
// import { saveMission, deleteMission } from "@/app/actions/missions";
```

with nothing (remove the import).

Find:

```tsx
type Props = {
  adventureId: number;
  mission?: Mission | null;
  onClose: () => void;
};

export default function MissionEditorModal({ adventureId, mission, onClose }: Props) {
  const isNew = !mission;
  const [name, setName] = useState(mission?.title ?? "");
  const [difficulty, setDifficulty] = useState<number>(mission?.difficulty ?? 2);

  const [state, formAction, pending] = useActionState(saveMission, {});
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (state.message === "ok") onClose();
  }, [state.message]);

  function handleDelete() {
    if (!mission) return;
    const fd = new FormData();
    fd.set("id", String(mission.id));
    fd.set("adventureId", String(adventureId));
    startDelete(async () => {
      await deleteMission(fd);
      onClose();
    });
  }
```

Replace with:

```tsx
type Props = {
  adventureId: number;
  mission?: Mission | null;
  onClose: () => void;
  onSaved: () => void;
};

type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function MissionEditorModal({ adventureId, mission, onClose, onSaved }: Props) {
  const isNew = !mission;
  const [name, setName] = useState(mission?.title ?? "");
  const [difficulty, setDifficulty] = useState<number>(mission?.difficulty ?? 2);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [deletePending, startDelete] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = isNew
        ? await fetch(`/api/mobile/adventures/${adventureId}/missions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: name.trim(), difficulty }),
          })
        : await fetch(`/api/mobile/missions/${mission!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: name.trim(), difficulty }),
          });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo guardar la misión." });
        return;
      }
      onSaved();
      onClose();
    } catch {
      setSaveState({ status: "error", error: "No se pudo guardar la misión." });
    }
  }

  function handleDelete() {
    if (!mission) return;
    startDelete(async () => {
      const res = await fetch(`/api/mobile/missions/${mission.id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      onSaved();
      onClose();
    });
  }
```

Find:

```tsx
        <form
          action={formAction}
          style={{
```

Replace with:

```tsx
        <form
          onSubmit={handleSubmit}
          style={{
```

Find:

```tsx
          {state.errors?.title && (
            <p style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{state.errors.title[0]}</p>
          )}
```

Replace with:

```tsx
          {saveState.status === "error" && (
            <p style={{ fontSize: 12.5, color: "#E8A0A0", marginTop: 5 }}>{saveState.error}</p>
          )}
```

Find (twice — once in the delete button, once in the submit button):

```tsx
              disabled={!canSave || pending}
```

Replace with:

```tsx
              disabled={!canSave || saveState.status === "saving"}
```

Find:

```tsx
              {pending ? "..." : isNew ? "Añadir misión" : "Guardar cambios"}
```

Replace with:

```tsx
              {saveState.status === "saving" ? "..." : isNew ? "Añadir misión" : "Guardar cambios"}
```

- [ ] **Step 9: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 10: Manual browser verification**

1. Log in, land on `/`. Expected: brief "Cargando tu dashboard…" then the dashboard renders with the same layout, greeting, adventures, streak, and (if checked in today) recommendations as before.
2. Create a new adventure with an initial mission via the "Nueva aventura" panel. Expected: appears in the list without a full reload.
3. Select an adventure, toggle a mission's checkbox and the "Completar misión de hoy" button. Expected: both update the list and the XP/progress numbers.
4. Edit and delete a mission via the pencil icon → `MissionEditorModal`.
5. Open the kebab menu (⋮) on a selected adventure → edit its title/palette/status → save. Then delete an adventure. Expected: both work and the list updates.
6. If you have a check-in for today, confirm the recommendations card still shows (or the fallback message if the recommender service isn't running locally).

- [ ] **Step 11: Commit**

```bash
git add app/page.tsx components/DashboardBody.tsx components/NewAdventurePanel.tsx components/AdventureEditorModal.tsx components/MissionEditorModal.tsx
git commit -m "feat(web-api-migration): migrate / dashboard to fetch-based loading and mutations"
```

---

### Task 4: Delete now-unused Server Actions and dead components

**Files:**
- Delete: `apps/web/app/actions/adventures.ts`
- Delete: `apps/web/app/actions/missions.ts`
- Delete: `apps/web/components/NewAdventureForm.tsx`

**Interfaces:**
- Consumes: confirmation from Tasks 2-3 that nothing imports these anymore.
- Produces: nothing (terminal cleanup task).

- [ ] **Step 1: Confirm nothing still imports them**

Run: `grep -rn "app/actions/adventures\|app/actions/missions\|components/NewAdventureForm\|NewAdventureForm\b" --include="*.tsx" --include="*.ts" .`

Expected: no matches outside of `docs/superpowers/` (plan/spec files mentioning them in prose don't count) and the files' own self-references before deletion.

- [ ] **Step 2: Delete the files**

```bash
rm app/actions/adventures.ts app/actions/missions.ts components/NewAdventureForm.tsx
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add -A app/actions/adventures.ts app/actions/missions.ts components/NewAdventureForm.tsx
git commit -m "chore(web-api-migration): remove adventures/missions Server Actions and dead NewAdventureForm"
```

---

## Self-Review Notes

- **Spec coverage:** completes the "Adventures + Missions" slice of the page-based migration order (Architecture C in the design spec), covering `/` and the previously-undiscovered `/adventures/[id]` together since they share the same resource and Server Actions. `/progress` remains as a final follow-up plan.
- **Behavior parity checked:** streak/weekDays computation preserved exactly (same UTC day-keying, same 30-count window via `?limit=30`, not the `?days=N` date-range mode built for `/checkin` — those are different semantics and this plan uses the one that actually matches the dashboard's original Prisma query). Recommendations' `null`-vs-object distinction intentionally collapses (see Global Constraints) with no visible UI difference. Validation error display narrows from per-field to a single message in the same visual slot, consistent with how `/checkin`'s migration already handled this.
- **Scope decisions:** `components/AdventureCard.tsx` and `components/NewAdventureForm.tsx` are confirmed dead code; only the latter is deleted here (it would otherwise become a dangling import once Task 4 deletes its Server Action dependency, the same reasoning as `CheckInForm.tsx` in the `/checkin` plan). `AdventureCard.tsx` has no such forced dependency and is left for a separate cleanup pass, not bundled in here.
