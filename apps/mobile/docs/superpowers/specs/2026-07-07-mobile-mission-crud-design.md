# Mobile Mission CRUD (Round C2b) — Design Spec
**Date:** 2026-07-07
**Status:** Approved

---

## Overview

This is **Round C2b** of "Sub-project 3" (the mobile dashboard/misiones initiative from `ROADMAP.md`'s Fase 15), following **Round C2a** (adventure CRUD, merged via PR #12). The original "Round C2" (CRUD for adventures + missions) was split at C2a's brainstorming time into C2a (adventures) and this round, C2b (missions) — independent pieces touching different screens.

Round C2b's goal: the user can create a new mission inside an adventure, edit an existing one (title + difficulty), and delete one — all against the already-shipped `/api/mobile/adventures/:id/missions` and `/api/mobile/missions/:id` endpoints, no backend changes.

## Non-Goals

- Editing a mission's `description` field — mobile never sets or displays it (same reasoning as adventures in C2a: no exposed field for something the mission form doesn't ask for).
- Any change to `apps/web` or `/api/mobile/*` — pure consumer of already-shipped endpoints.
- Automated tests (no test framework exists in `apps/mobile`) — manual verification via Expo Go.

## Architecture

### One shared screen, two modes

Unlike Round C2a (which used two separate files for adventure create/edit), the mission form is genuinely simple (title + difficulty, nothing else) and nearly identical between the two cases — matching `apps/web`'s own `MissionEditorModal.tsx`, which already handles both create and edit in a single component via an `isNew` flag. Mobile follows the same idea, adapted to Expo Router's file-based routing: **one route file**, `src/app/adventures/[id]/missions/[missionId].tsx`, where the `missionId` segment is either the literal string `"new"` (create mode) or a real mission id (edit mode). `isNew = missionId === "new"` drives every branch in the component.

### No fetch-on-mount for edit mode

There is no `GET /api/mobile/missions/:id` endpoint in this backend (only `PATCH`/`DELETE` exist on `/api/mobile/missions/:id` — confirmed by reading the route handler). Rather than adding a new fetch path (e.g., re-fetching the whole adventure and finding the mission by id), Adventure Detail — which already holds every mission's current `title`/`difficulty` in memory to render the list — passes them forward as navigation params when the user taps "Editar". This means the edit screen opens with the form already filled, with **no loading state, no load-error state, and no network round-trip** on open — a meaningful simplification over every prior round's screens.

### Navigation

- `src/app/adventures/[id].tsx` (Adventure Detail, modified) — gains:
  - A "+ Agregar misión" button, navigating via `router.push(\`/adventures/${id}/missions/new\`)`.
  - Each mission row is restructured: the existing tap-to-toggle area stays (now `flex: 1`, not covering the whole row), and a new "Editar" `Pressable` sits to its right, navigating via `router.push({ pathname: "/adventures/[id]/missions/[missionId]", params: { id, missionId: String(m.id), title: m.title, difficulty: String(m.difficulty) } })`.
- `src/app/adventures/[id]/missions/[missionId].tsx` (new) — the shared create/edit/delete screen, nested under the existing `adventures/[id]/` structure alongside `edit.tsx` (Round C2a) and the parent `[id].tsx` (Adventure Detail) — Expo Router resolves this nesting without touching either existing route.

### New files

```
apps/mobile/src/
└── app/
    └── adventures/
        ├── [id].tsx                         # modified: "+ Agregar misión" + per-row "Editar"
        └── [id]/
            ├── edit.tsx                      # unchanged (Round C2a)
            └── missions/
                └── [missionId].tsx           # new: create/edit/delete mission
```

No new files under `src/lib/`. Reuses `apiRequest`/`ApiError` (`@/lib/api`), `getMobileMoment` (`@/lib/mobile-theme`), and `MissionData` (`@/lib/types`) — all already existing.

## Data Flow

### Reading params (`missions/[missionId].tsx`)

```ts
const { id, missionId, title: titleParam, difficulty: difficultyParam } =
  useLocalSearchParams<{ id: string; missionId: string; title?: string; difficulty?: string }>();
const isNew = missionId === "new";
```

- Local state: `title` (init `""` if new, else `titleParam ?? ""`), `difficulty` (init `2` if new — "Media", matching `apps/web`'s own default — else `Number(difficultyParam) || 2`), `saveState`, `deleteState`.
- Validation: `canSave = title.trim().length >= 3` — matches both backend schemas' `min(3)` rule for mission titles.

### Save

- **Create:** `POST /api/mobile/adventures/${id}/missions` with `{ title: title.trim(), difficulty }`. On success: `router.back()` (returns to Adventure Detail, whose existing `useFocusEffect` — from Round C2a — refetches and shows the new mission).
- **Edit:** `PATCH /api/mobile/missions/${missionId}` with `{ title: title.trim(), difficulty }`. On success: `router.back()`.
- On failure (either mode): inline error message, `title`/`difficulty` preserved for retry — same principle as every prior round's forms.

### Delete (edit mode only — the button doesn't render when `isNew`)

- Tapping "Eliminar misión" shows a native `Alert.alert` (Cancelar / Eliminar, destructive style) — same pattern as Round C2a's adventure delete.
- Only on confirming: `DELETE /api/mobile/missions/${missionId}` → on success, `router.back()`. Unlike deleting an *adventure* (Round C2a, which needed `dismissTo` because the containing Adventure Detail screen became invalid), deleting a *mission* leaves Adventure Detail itself perfectly valid to return to — a plain `router.back()` is correct here, no `dismissTo` needed.
- On failure: inline error message, no navigation.

## Error Handling

- **No load-error state** — there is nothing to load (see Architecture).
- **Save failure:** inline error, form state preserved.
- **Delete failure:** inline error, no navigation.
- **Delete confirmation cancelled:** no-op.
- **401 / expired token:** already handled transparently by `apiRequest()`.

## Testing / Verification

No automated test framework exists in `apps/mobile` (consistent with every prior round). Verification is manual, same setup as prior rounds:

1. Login → open an adventure → Adventure Detail shows "+ Agregar misión" and each existing mission has a separate "Editar" affordance next to its (unchanged) toggle area.
2. Tap "+ Agregar misión" → title + difficulty (default "Media") → try 1-2 characters first (button disabled), then a real title → "Crear misión" → back on Adventure Detail, the new mission appears in the list.
3. Tap "Editar" on an existing mission → form opens **already filled** with its current title/difficulty (no spinner) → change the title and/or difficulty → "Guardar cambios" → back on Adventure Detail, the change is reflected.
4. Tap "Editar" again → "Eliminar misión" → confirm the native alert (Cancelar/Eliminar) → Cancelar first (nothing happens) → Eliminar misión again, confirm → back on Adventure Detail, the mission is gone.
5. Confirm the tap-to-toggle area still works correctly and independently from "Editar" — tapping the row body still toggles completion; tapping "Editar" never toggles.
6. Server stopped: creating/editing both show inline error state without crashing and without losing the typed title; restarting the server and retrying succeeds normally.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Passing `title`/`difficulty` via navigation params instead of fetching fresh could show stale data if the mission changed between Adventure Detail's last load and the tap on "Editar" | Accepted — same trade-off already made in Round C2a's edit screen (no concurrent-edit protection needed for a single-user personal app); Adventure Detail's own `useFocusEffect` keeps its in-memory list reasonably fresh already |
| One shared screen with an `isNew` branch could grow tangled if the two modes diverge further later | Not a concern today — the two modes differ only in which HTTP verb/endpoint is called and whether the delete button renders; revisit only if a real divergence appears (YAGNI otherwise) |

## Future Work (explicitly deferred)

- Round A.5: port `sky-engine.ts` to React Native (separate, already-scoped future round).
- Editing a mission's `description`, if ever needed — not requested for this round.
- A shared `packages/` workspace for theme/type values if `apps/web`/`apps/mobile` drift becomes a real maintenance problem (same open item flagged in every prior round).
