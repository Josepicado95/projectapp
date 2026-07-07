# Mobile Adventure CRUD (Round C2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create/edit/delete for adventures to `apps/mobile` — a "+ Nueva aventura" flow from the Dashboard, and an "Editar" flow (with delete) from Adventure Detail — wired against the existing `/api/mobile/adventures` and `/api/mobile/adventures/:id` endpoints, no backend changes.

**Architecture:** Two new, self-contained stack screens (`adventures/new.tsx`, `adventures/[id]/edit.tsx`) each own their own local form state and API calls — no shared hook, matching every prior round's precedent. The Dashboard and Adventure Detail screens each gain one small addition (an entry-point button, and an "Editar" button + focus-triggered refetch, respectively).

**Tech Stack:** Expo Router, TypeScript, NativeWind, `expo-linear-gradient` and `react-native`'s built-in `Alert` (already available) — no new dependencies.

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-adventure-crud-design.md`

## Global Constraints

- Run all commands in this plan from `apps/mobile/` unless a step says otherwise.
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as the rest of `apps/mobile`.
- No automated test framework — verification is `npx tsc --noEmit` per task, plus a final manual pass on a physical phone via Expo Go.
- Import other `apps/mobile/src/*` modules via the `@/` alias.
- No changes to `apps/web` or any `/api/mobile/*` route handler — this plan is a pure consumer of already-shipped endpoints.
- No new files under `src/lib/` and no new npm dependencies. The 5-entry landscape palette is duplicated locally (as hex-tuple arrays) in both new screens that need it — do not extract a shared file for this.
- No "initial missions" field on the creation screen — title + palette only, per the spec's Non-Goals.
- The edit screen must send `status` and `description` back **unchanged** (fetched, then passed through as-is) on every save — never expose inputs for them.
- Deleting an adventure must show a native `Alert.alert` confirmation (Cancelar / Eliminar, destructive style) before calling `DELETE` — never delete on a single tap.
- Task ordering is deliberate: both new screens (Tasks 1-2) are built *before* the Dashboard/Adventure Detail modifications that reference them (Tasks 3-4), so `router.push`/`router.push` never point at a route that doesn't exist yet — same transient-typed-routes avoidance used in every prior round.

**Important TypeScript detail carried through this plan:** `expo-linear-gradient`'s `LinearGradient` component types its `colors` prop as `readonly [ColorValue, ColorValue, ...ColorValue[]]` — a tuple requiring **at least 2 elements**, not a plain `string[]`. Declaring the palette array as `[string, string, string][]` (an array of fixed 3-tuples) rather than `string[][]` is required for `colors={paletteEntry}` to type-check when `paletteEntry` comes from a variable (as opposed to an inline array literal, which TypeScript would contextually type regardless). Every task below that touches `PALETTES` uses this exact typing — do not simplify it to `string[][]`, it will fail `tsc --noEmit`.

---

### Task 1: Create adventure screen

**Files:**
- Create: `apps/mobile/src/app/adventures/new.tsx`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `AdventureSummary` (`@/lib/types`, existing, from Round A); `getMobileMoment` (`@/lib/mobile-theme`, existing); `useRouter` (`expo-router`).
- Produces: the route `/adventures/new`, consumed by Task 3's Dashboard button.

This task is self-contained (own local form state) and does not depend on any shared hook.

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/adventures/new.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureSummary } from "@/lib/types";

const PALETTES: [string, string, string][] = [
  ["#2C3A52", "#5E5670", "#A88098"],
  ["#C7DBE4", "#9DB6A4", "#7E9A86"],
  ["#F2D2A6", "#E3A878", "#C2825F"],
  ["#2C2A4E", "#5A4E78", "#9A7E9E"],
  ["#1E2C49", "#3E5A7E", "#7E9A86"],
];

type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function NewAdventureScreen() {
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [title, setTitle] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const canCreate = title.trim().length >= 3;

  async function handleCreate() {
    if (!canCreate) return;
    setSaveState({ status: "saving" });
    try {
      const created = await apiRequest<AdventureSummary>("/api/mobile/adventures", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), paletteIdx }),
      });
      router.replace(`/adventures/${created.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la aventura.";
      setSaveState({ status: "error", error: message });
    }
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Nueva aventura
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          ¿Cómo se llama tu aventura?
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Recuperar el sueño"
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
          Elige su paisaje
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          {PALETTES.map((colors, i) => (
            <Pressable key={i} onPress={() => setPaletteIdx(i)} style={{ flex: 1 }}>
              <LinearGradient
                colors={colors}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: i === paletteIdx ? 2 : 0,
                  borderColor: theme.textPrimary,
                }}
              />
            </Pressable>
          ))}
        </View>

        {saveState.status === "error" && (
          <Text style={{ color: "#F0A0A0", marginBottom: 14, textAlign: "center" }}>{saveState.error}</Text>
        )}

        <Pressable
          onPress={handleCreate}
          disabled={!canCreate || saveState.status === "saving"}
          style={{
            backgroundColor: theme.textPrimary,
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            opacity: !canCreate || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Creando..." : "Crear aventura"}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
```

Notes on specific decisions:
- `PALETTES` is typed `[string, string, string][]` (not `string[][]`) — see the Global Constraints section's TypeScript detail. Each `.map` callback's `colors` parameter is therefore inferred as the concrete 3-tuple type, which satisfies `LinearGradient`'s `colors` prop.
- `canCreate = title.trim().length >= 3` matches the backend's `CreateAdventureSchema` exactly (see spec).
- `router.replace` (not `push`) on success — the created adventure's detail screen should have the Dashboard behind it in the stack, not this now-stale form.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/adventures/new.tsx
git commit -m "feat(mobile): add create adventure screen"
```

---

### Task 2: Edit + delete adventure screen

**Files:**
- Create: `apps/mobile/src/app/adventures/[id]/edit.tsx`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `AdventureDetail` (`@/lib/types`, existing); `getMobileMoment` (`@/lib/mobile-theme`, existing); `useLocalSearchParams`, `useRouter` (`expo-router`); `Alert` (`react-native`, built-in).
- Produces: the route `/adventures/[id]/edit`, consumed by Task 4's Adventure Detail "Editar" button.

This task nests under the existing `adventures/[id]/` structure alongside `adventures/[id].tsx` (Adventure Detail) — Expo Router resolves `adventures/[id]/edit.tsx` as `/adventures/:id/edit` without any change to the existing route.

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/adventures/[id]/edit.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureDetail } from "@/lib/types";

const PALETTES: [string, string, string][] = [
  ["#2C3A52", "#5E5670", "#A88098"],
  ["#C7DBE4", "#9DB6A4", "#7E9A86"],
  ["#F2D2A6", "#E3A878", "#C2825F"],
  ["#2C2A4E", "#5A4E78", "#9A7E9E"],
  ["#1E2C49", "#3E5A7E", "#7E9A86"],
];

type LoadState = "loading" | "ready" | "error";
type SaveState = { status: "idle" | "saving" | "error"; error?: string };
type DeleteState = { status: "idle" | "deleting" | "error"; error?: string };

export default function EditAdventureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventure, setAdventure] = useState<AdventureDetail | null>(null);
  const [title, setTitle] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: "idle" });

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await apiRequest<AdventureDetail>(`/api/mobile/adventures/${id}`);
      setAdventure(data);
      setTitle(data.title);
      setPaletteIdx(data.paletteIdx);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canSave = title.trim().length >= 3;

  async function handleSave() {
    if (!canSave || !adventure) return;
    setSaveState({ status: "saving" });
    try {
      await apiRequest(`/api/mobile/adventures/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          description: adventure.description ?? undefined,
          status: adventure.status,
          paletteIdx,
        }),
      });
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar la aventura.";
      setSaveState({ status: "error", error: message });
    }
  }

  async function handleDelete() {
    setDeleteState({ status: "deleting" });
    try {
      await apiRequest(`/api/mobile/adventures/${id}`, { method: "DELETE" });
      router.dismissTo("/(tabs)");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo borrar la aventura.";
      setDeleteState({ status: "error", error: message });
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Eliminar aventura",
      "Se borrará también todas sus misiones. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  if (loadState === "loading") {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.textPrimary} />
      </LinearGradient>
    );
  }

  if (loadState === "error" || !adventure) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 16, textAlign: "center" }}>
          No se pudo cargar la aventura.
        </Text>
        <Pressable onPress={load} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Reintentar</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Editar aventura
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Nombre
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nombre de la aventura"
          placeholderTextColor={theme.textSecondary}
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
          Paisaje
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          {PALETTES.map((colors, i) => (
            <Pressable key={i} onPress={() => setPaletteIdx(i)} style={{ flex: 1 }}>
              <LinearGradient
                colors={colors}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: i === paletteIdx ? 2 : 0,
                  borderColor: theme.textPrimary,
                }}
              />
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
            marginBottom: 14,
            opacity: !canSave || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>

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
            {deleteState.status === "deleting" ? "Eliminando..." : "Eliminar aventura"}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
```

Notes on specific decisions:
- `handleSave`'s `PATCH` body sends `description: adventure.description ?? undefined` and `status: adventure.status` — both taken from the **fetched** `adventure`, never from an input the user can edit. This is a hard requirement (see Global Constraints) — it prevents accidentally wiping a `description` that might already exist (e.g. set via `apps/web`) and satisfies the backend's `UpdateAdventureSchema`, which requires `status`.
- `confirmDelete` is the button's `onPress`; it never calls `handleDelete` directly — only the `Alert.alert`'s "Eliminar" (destructive-style) button does, after the user explicitly confirms. Tapping "Cancelar" calls nothing (no `onPress` needed on a `style: "cancel"` button — React Native dismisses the alert automatically).
- `router.dismissTo("/(tabs)")` on successful delete — this is the same literal Href (`"/(tabs)"`) already used successfully elsewhere in this codebase (`src/app/_layout.tsx`'s `router.replace("/(tabs)")`), confirmed to resolve to the Dashboard.
- Delete failure shows an inline error and does **not** navigate — the user stays on the edit screen and can retry.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "src/app/adventures/[id]/edit.tsx"
git commit -m "feat(mobile): add edit and delete adventure screen"
```

---

### Task 3: Adventure Detail — "Editar" button + focus refetch

**Files:**
- Modify: `apps/mobile/src/app/adventures/[id].tsx`

**Interfaces:**
- Consumes: the `/adventures/[id]/edit` route (Task 2); `useFocusEffect` (`expo-router`).

- [ ] **Step 1: Add the `useFocusEffect` import**

In `apps/mobile/src/app/adventures/[id].tsx`, change:

```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
```

to:

```tsx
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
```

(`useCallback` is already imported from `"react"` on line 1 — no change needed there.)

- [ ] **Step 2: Add the focus-triggered refetch**

Right after this existing block:

```tsx
  useEffect(() => {
    load();
  }, [load]);
```

add:

```tsx

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
```

- [ ] **Step 3: Add the "Editar" button next to the title**

Change this existing block:

```tsx
        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4 }}>
          {adventure.title}
        </Text>
```

to:

```tsx
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", flex: 1 }}>
            {adventure.title}
          </Text>
          <Pressable onPress={() => router.push(`/adventures/${id}/edit`)}>
            <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Editar</Text>
          </Pressable>
        </View>
```

(`View` is already imported on line 2 — no import change needed for this step.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no output (the `/adventures/[id]/edit` route already exists from Task 2, so no typed-routes gap).

- [ ] **Step 5: Commit**

```bash
git add "src/app/adventures/[id].tsx"
git commit -m "feat(mobile): add edit entry point and focus refetch to Adventure Detail"
```

---

### Task 4: Dashboard — "+ Nueva aventura" entry point

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: the `/adventures/new` route (Task 1); `useRouter` (`expo-router`, already imported in this file).

- [ ] **Step 1: Add the "+ Nueva aventura" button above the adventures list**

In `apps/mobile/src/app/(tabs)/index.tsx`, change this existing block:

```tsx
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>
        {adventures.length === 0 ? (
```

to:

```tsx
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>

        <Pressable
          onPress={() => router.push("/adventures/new")}
          style={{ borderColor: theme.textSecondary, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, alignItems: "center" }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 14 }}>+ Nueva aventura</Text>
        </Pressable>

        {adventures.length === 0 ? (
```

(This button uses an outlined style — a border instead of the filled `theme.cardBg` background every other card/button uses — so it reads visually as an "add" affordance distinct from real adventure cards, rather than competing with them.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output (the `/adventures/new` route already exists from Task 1, so no typed-routes gap).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(tabs)/index.tsx"
git commit -m "feat(mobile): add new-adventure entry point to Dashboard"
```

---

### Task 5: Full end-to-end verification on a physical phone

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

1. Log in with `jose@aventuras.com` / `aventuras123` → Dashboard shows a "+ Nueva aventura" button above the adventures list.
2. Tap it → try a 1-2 character title first (confirm "Crear aventura" stays disabled/greyed out), then a real title, pick a landscape → "Crear aventura" → lands directly on that new adventure's (empty) Adventure Detail screen.
3. Tap "< Volver" from there → returns to the Dashboard (not the creation form), and the new adventure appears in "Tus aventuras".
4. Tap into that adventure again → tap "Editar" → change the title and/or landscape → "Guardar cambios" → returns to Adventure Detail showing the updated title/landscape without a manual reload.
5. Tap "Editar" again → tap "Eliminar aventura" → confirm the native alert shows "Cancelar"/"Eliminar" → tap "Cancelar" first → nothing happens, still on the edit screen. Tap "Eliminar aventura" again → this time tap "Eliminar" → lands directly on the Dashboard, and the adventure is gone from the list.
6. Server stopped: try creating an adventure (shows inline error, title you typed is still there) and try editing an existing one (same). Restart the server, retry both → succeed normally.

- [ ] **Step 3: Report results**

If every step matches, Round C2a is complete. If the delete confirmation doesn't appear, or an edited adventure's description/status silently changes (check via `apps/web` if you have an adventure with a description set there), note the specific discrepancy — don't guess at a fix without seeing the actual behavior.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — create screen (Task 1), edit+delete screen (Task 2), Adventure Detail's entry point and refresh (Task 3), Dashboard's entry point (Task 4), manual verification of every behavior in the spec's Testing section (Task 5).
- **Scope check:** no mission CRUD, no initial-missions-during-creation, no description/status editing UI — matching the spec's Non-Goals exactly.
- **Ordering:** Tasks 1-2 (the two new screens) are deliberately before Tasks 3-4 (the modifications that reference them), avoiding the same transient typed-routes gap called out in every prior round's plan.
- **Type consistency:** `AdventureSummary` (Task 1) and `AdventureDetail` (Task 2) are the exact existing types from `@/lib/types` — no redefinition. `PALETTES`'s `[string, string, string][]` typing (both Tasks 1 and 2, byte-identical) is called out explicitly in the Global Constraints to prevent a real `tsc` failure if simplified to `string[][]` — verified against the installed `expo-linear-gradient`'s `LinearGradientProps.colors: readonly [ColorValue, ColorValue, ...ColorValue[]]` type. `router.dismissTo` (Task 2) is confirmed present on `useRouter()`'s returned `ImperativeRouter` type in the installed `expo-router` version.
