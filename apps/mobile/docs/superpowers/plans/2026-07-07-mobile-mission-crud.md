# Mobile Mission CRUD (Round C2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create/edit/delete for missions to `apps/mobile` — a single shared form screen reached from Adventure Detail (either "+ Agregar misión" or a per-row "Editar" button) — wired against the existing `/api/mobile/adventures/:id/missions` and `/api/mobile/missions/:id` endpoints, no backend changes.

**Architecture:** One new, self-contained stack screen (`adventures/[id]/missions/[missionId].tsx`) handles both create and edit via an `isNew = missionId === "new"` flag — no `GET` fetch on open, since Adventure Detail already has each mission's current data in memory and passes it forward as navigation params. Adventure Detail gains an entry-point button and restructures each mission row to separate the existing tap-to-toggle area from a new "Editar" affordance.

**Tech Stack:** Expo Router, TypeScript, NativeWind, `react-native`'s built-in `Alert` — no new dependencies.

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-07-mobile-mission-crud-design.md`

## Global Constraints

- Run all commands in this plan from `apps/mobile/` unless a step says otherwise.
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as the rest of `apps/mobile`.
- No automated test framework — verification is `npx tsc --noEmit` per task, plus a final manual pass on a physical phone via Expo Go.
- Import other `apps/mobile/src/*` modules via the `@/` alias.
- No changes to `apps/web` or any `/api/mobile/*` route handler — this plan is a pure consumer of already-shipped endpoints.
- No new files under `src/lib/` and no new npm dependencies.
- The mission form screen must NOT fetch anything on mount — `title`/`difficulty` for edit mode come exclusively from navigation params (`useLocalSearchParams`), passed by Adventure Detail, which already holds this data. There is no `GET /api/mobile/missions/:id` endpoint to fetch from even if this were attempted.
- Deleting a mission must show a native `Alert.alert` confirmation (Cancelar / Eliminar, destructive style) before calling `DELETE` — same pattern as Round C2a's adventure delete.
- On successful delete, use `router.back()` — NOT `router.dismissTo`. Unlike deleting an adventure (which invalidates the Adventure Detail screen underneath), deleting a mission leaves Adventure Detail itself valid to return to.
- Task ordering is deliberate: the mission form screen (Task 1) is built *before* Adventure Detail's modifications that reference it (Task 2), so `router.push` never points at a route that doesn't exist yet — same transient-typed-routes avoidance used in every prior round.

---

### Task 1: Mission create/edit/delete screen

**Files:**
- Create: `apps/mobile/src/app/adventures/[id]/missions/[missionId].tsx`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `getMobileMoment` (`@/lib/mobile-theme`, existing); `useLocalSearchParams`, `useRouter` (`expo-router`); `Alert` (`react-native`, built-in).
- Produces: the route `/adventures/[id]/missions/[missionId]`, consumed by Task 2's Adventure Detail buttons (both the "+ Agregar misión" button, which navigates with `missionId: "new"`, and each mission's "Editar" button, which navigates with the real mission id plus `title`/`difficulty` params).

This task nests under the existing `adventures/[id]/` structure alongside `adventures/[id]/edit.tsx` (Round C2a) — Expo Router resolves `adventures/[id]/missions/[missionId].tsx` as `/adventures/:id/missions/:missionId` without touching either existing route.

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/adventures/[id]/missions/[missionId].tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";

const DIFFICULTY_LEVELS = [
  { value: 1, label: "Suave" },
  { value: 2, label: "Media" },
  { value: 3, label: "Reto" },
];

type SaveState = { status: "idle" | "saving" | "error"; error?: string };
type DeleteState = { status: "idle" | "deleting" | "error"; error?: string };

export default function MissionFormScreen() {
  const { id, missionId, title: titleParam, difficulty: difficultyParam } = useLocalSearchParams<{
    id: string;
    missionId: string;
    title?: string;
    difficulty?: string;
  }>();
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());
  const isNew = missionId === "new";

  const [title, setTitle] = useState(isNew ? "" : titleParam ?? "");
  const [difficulty, setDifficulty] = useState(isNew ? 2 : Number(difficultyParam) || 2);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: "idle" });

  const canSave = title.trim().length >= 3;

  async function handleSave() {
    if (!canSave) return;
    setSaveState({ status: "saving" });
    try {
      if (isNew) {
        await apiRequest(`/api/mobile/adventures/${id}/missions`, {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), difficulty }),
        });
      } else {
        await apiRequest(`/api/mobile/missions/${missionId}`, {
          method: "PATCH",
          body: JSON.stringify({ title: title.trim(), difficulty }),
        });
      }
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar la misión.";
      setSaveState({ status: "error", error: message });
    }
  }

  async function handleDelete() {
    setDeleteState({ status: "deleting" });
    try {
      await apiRequest(`/api/mobile/missions/${missionId}`, { method: "DELETE" });
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo borrar la misión.";
      setDeleteState({ status: "error", error: message });
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Eliminar misión",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          {isNew ? "Nueva misión" : "Editar misión"}
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Misión
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Terminar curso de React"
          placeholderTextColor={theme.textSecondary}
          autoFocus
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 14,
            padding: 14,
            fontSize: 15,
            color: theme.textPrimary,
            marginBottom: 24,
          }}
        />

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Dificultad
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          {DIFFICULTY_LEVELS.map((lv) => (
            <Pressable
              key={lv.value}
              onPress={() => setDifficulty(lv.value)}
              style={{
                flex: 1,
                backgroundColor: difficulty === lv.value ? theme.textPrimary : theme.cardBg,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: difficulty === lv.value ? theme.gradientFrom : theme.textPrimary, fontWeight: "700" }}>
                {lv.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {saveState.status === "error" && (
          <Text style={{ color: "#F0A0A0", marginBottom: 14, textAlign: "center" }}>{saveState.error}</Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={!canSave || saveState.status === "saving"}
          style={{
            backgroundColor: theme.textPrimary,
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            marginBottom: isNew ? 0 : 14,
            opacity: !canSave || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Guardando..." : isNew ? "Crear misión" : "Guardar cambios"}
          </Text>
        </Pressable>

        {!isNew && (
          <>
            {deleteState.status === "error" && (
              <Text style={{ color: "#F0A0A0", marginBottom: 14, textAlign: "center" }}>{deleteState.error}</Text>
            )}
            <Pressable
              onPress={confirmDelete}
              disabled={deleteState.status === "deleting"}
              style={{
                backgroundColor: "rgba(220,80,80,.15)",
                borderRadius: 14,
                padding: 15,
                alignItems: "center",
                opacity: deleteState.status === "deleting" ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#F0A0A0", fontWeight: "700" }}>
                {deleteState.status === "deleting" ? "Eliminando..." : "Eliminar misión"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
```

Notes on specific decisions:
- `isNew = missionId === "new"` drives every branch: which endpoint/verb `handleSave` calls, the screen title, the button label, and whether the delete section renders at all.
- `title`/`difficulty` initial state reads from the navigation params (`titleParam`/`difficultyParam`) only when `!isNew` — there is no fetch anywhere in this file.
- `router.back()` is used for every successful outcome (save in either mode, delete) — never `dismissTo`, since Adventure Detail (the screen underneath) always remains valid to return to.
- The delete section (button + its own error text) is wrapped in `{!isNew && (...)}` — it doesn't exist at all when creating a new mission.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "src/app/adventures/[id]/missions/[missionId].tsx"
git commit -m "feat(mobile): add mission create/edit/delete screen"
```

---

### Task 2: Adventure Detail — "+ Agregar misión" and per-row "Editar"

**Files:**
- Modify: `apps/mobile/src/app/adventures/[id].tsx`

**Interfaces:**
- Consumes: the `/adventures/[id]/missions/[missionId]` route (Task 1).

- [ ] **Step 1: Add the "+ Agregar misión" button**

In `apps/mobile/src/app/adventures/[id].tsx`, change this existing block:

```tsx
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 24 }}>
          {done} de {total} misiones completadas
        </Text>

        {adventure.missions.map((m) => (
```

to:

```tsx
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 24 }}>
          {done} de {total} misiones completadas
        </Text>

        <Pressable
          onPress={() => router.push(`/adventures/${id}/missions/new`)}
          style={{ borderColor: theme.textSecondary, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, alignItems: "center" }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 14 }}>+ Agregar misión</Text>
        </Pressable>

        {adventure.missions.map((m) => (
```

- [ ] **Step 2: Restructure each mission row to separate toggle from edit**

Change this existing block:

```tsx
          <Pressable
            key={m.id}
            onPress={() => toggleMission(m)}
            style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>{m.completed ? "✓" : "○"}</Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontWeight: "500",
                flex: 1,
                textDecorationLine: m.completed ? "line-through" : "none",
              }}
            >
              {m.title}
            </Text>
          </Pressable>
        ))}
```

to:

```tsx
          <View
            key={m.id}
            style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Pressable onPress={() => toggleMission(m)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>{m.completed ? "✓" : "○"}</Text>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontWeight: "500",
                  flex: 1,
                  textDecorationLine: m.completed ? "line-through" : "none",
                }}
              >
                {m.title}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/adventures/[id]/missions/[missionId]",
                  params: { id, missionId: String(m.id), title: m.title, difficulty: String(m.difficulty) },
                })
              }
              style={{ marginLeft: 12 }}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Editar</Text>
            </Pressable>
          </View>
        ))}
```

Notes on this change:
- The outer element changes from `Pressable` to `View` — it's no longer directly tappable as a whole. The toggle behavior moves to an inner `Pressable` wrapping only the icon + title (given `flex: 1`), and a second, separate `Pressable` for "Editar" sits to its right. Tapping anywhere in the toggle area still calls `toggleMission(m)` exactly as before (untouched); tapping "Editar" never does.
- `title: m.title, difficulty: String(m.difficulty)` are passed as extra navigation params alongside the route's own `id`/`missionId` segments — Expo Router's object-form `router.push({ pathname, params })` merges dynamic route segments and arbitrary extra params into one object.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output (the `/adventures/[id]/missions/[missionId]` route already exists from Task 1, so no typed-routes gap).

- [ ] **Step 4: Commit**

```bash
git add "src/app/adventures/[id].tsx"
git commit -m "feat(mobile): add mission entry points to Adventure Detail"
```

---

### Task 3: Full end-to-end verification on a physical phone

**Files:** none (verification only).

- [ ] **Step 1: Start both servers**

Terminal 1, from `apps/web`:
```bash
npm run dev
```

Terminal 2, from `apps/mobile`:
```bash
npx expo start
```

Scan the QR code (or enter the `exp://<lan-ip>:8081` URL manually) with Expo Go, same LAN setup as prior rounds.

- [ ] **Step 2: Walk through the verification checklist**

1. Log in with `jose@aventuras.com` / `aventuras123` → open any adventure → Adventure Detail shows "+ Agregar misión" below the "X de Y misiones completadas" line, and each existing mission has a separate "Editar" link to the right of its (still tappable) toggle area.
2. Tap "+ Agregar misión" → try 1-2 characters first (button disabled), then a real title, pick a difficulty (default should be "Media") → "Crear misión" → back on Adventure Detail, the new mission appears in the list.
3. Tap "Editar" on that new mission → the form opens **already filled** with its title and difficulty (no spinner, no flash of empty fields) → change the title and/or difficulty → "Guardar cambios" → back on Adventure Detail, the change is visible immediately.
4. Tap the mission's toggle area (not "Editar") → confirm it still marks completed/pending exactly as before, and tapping "Editar" never toggles it.
5. Tap "Editar" again → "Eliminar misión" → confirm the native alert shows Cancelar/Eliminar → tap "Cancelar" first (nothing happens, still on the edit screen) → tap "Eliminar misión" again, this time confirm → back on Adventure Detail (not the Dashboard), and the mission is gone from the list.
6. Server stopped: try creating a mission and editing an existing one (both should show inline error state, title/difficulty preserved). Restart the server, retry both → succeed normally.

- [ ] **Step 3: Report results**

If every step matches, Round C2b is complete. If the toggle area and "Editar" ever fire together on a single tap, or an edited mission's difficulty doesn't persist correctly, note the specific discrepancy — don't guess at a fix without seeing the actual behavior.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — the shared create/edit/delete screen with no fetch-on-mount (Task 1), Adventure Detail's entry point and restructured rows (Task 2), manual verification of every behavior in the spec's Testing section (Task 3).
- **Scope check:** no description editing, no backend changes — matching the spec's Non-Goals exactly.
- **Ordering:** Task 1 (mission form screen) is deliberately before Task 2 (Adventure Detail's buttons referencing it), avoiding the same transient typed-routes gap called out in every prior round's plan.
- **Type consistency:** `useLocalSearchParams<{ id: string; missionId: string; title?: string; difficulty?: string }>()` (Task 1) matches exactly what Task 2's `router.push({ pathname, params })` call supplies — `id`, `missionId` (either `"new"` or `String(m.id)`), `title` (`m.title`, a `string`), `difficulty` (`String(m.difficulty)`, converted from `MissionData.difficulty: number`). No mismatched field names or types between the two tasks.
