# Mobile Adventure CRUD (Round C2a) — Design Spec
**Date:** 2026-07-06
**Status:** Approved

---

## Overview

This is **Round C2a** of "Sub-project 3" (the mobile dashboard/misiones initiative from `ROADMAP.md`'s Fase 15), following **Round C1** (Progress screen, merged via PR #11). The originally-planned "Round C" (CRUD + Progress) was split at C1's brainstorming time; the remaining CRUD work was further split here into **C2a** (adventures) and **C2b** (missions, future spec), since they're independent pieces touching different screens.

Round C2a's goal: the user can create a new adventure (title + landscape/palette), edit an existing one (title + palette), and delete one — all against the already-shipped `/api/mobile/adventures` and `/api/mobile/adventures/:id` endpoints, no backend changes.

## Non-Goals

- Mission CRUD (create/edit/delete a mission) — that's Round C2b.
- Adding "initial missions" during adventure creation (unlike `apps/web`'s `NewAdventurePanel.tsx`, which bundles a live draft-missions list into the creation form) — mobile creation is title + palette only; missions get added afterward via Adventure Detail, once C2b ships. This was an explicit simplification Jose chose to avoid managing a draft-list of missions inside the creation screen's state.
- Editing an adventure's `description` field — mobile never sets or displays a description; the edit screen preserves whatever value already exists (possibly set via `apps/web`) unchanged when saving, rather than exposing a description input.
- Editing an adventure's `status` (active/completed/paused) — preserved unchanged on save, same reasoning as `description`. No status-changing UI in mobile yet.
- Any change to `apps/web` or `/api/mobile/*` — pure consumer of already-shipped endpoints.
- Automated tests (no test framework exists in `apps/mobile`) — manual verification via Expo Go.

## Architecture

### Navigation

- `src/app/(tabs)/index.tsx` (Dashboard, modified) — gains a "+ Nueva aventura" entry point above the adventures list, navigating via `router.push("/adventures/new")`.
- `src/app/adventures/new.tsx` (new) — the creation screen, a stack route outside `(tabs)` (same pattern as every screen since Round A).
- `src/app/adventures/[id]/edit.tsx` (new) — the edit/delete screen, nested under `adventures/[id]/` alongside the existing `adventures/[id].tsx` (Adventure Detail) — Expo Router supports this nesting without touching the existing route.
- `src/app/adventures/[id].tsx` (Adventure Detail, modified) — gains an "Editar" button navigating to `/adventures/${id}/edit`, and a `useFocusEffect` that reruns its existing `load()` on every focus (so returning from a successful edit shows the updated title/palette without a manual reload).

### New files

```
apps/mobile/src/
└── app/
    ├── (tabs)/
    │   └── index.tsx           # modified: "+ Nueva aventura" entry point
    └── adventures/
        ├── [id].tsx            # modified: "Editar" button + useFocusEffect
        ├── new.tsx             # new: create screen
        └── [id]/
            └── edit.tsx        # new: edit + delete screen
```

No new files under `src/lib/`. Both new screens reuse `apiRequest`/`ApiError` (`@/lib/api`), `getMobileMoment` (`@/lib/mobile-theme`), and `AdventureSummary`/`AdventureDetail` (`@/lib/types`) — all already existing. The 5-entry landscape palette (`apps/web/lib/palettes.ts`'s `PALETTES`, CSS `linear-gradient` strings) is duplicated locally in both `new.tsx` and `edit.tsx` as arrays of 3 hex stops each — the format `expo-linear-gradient`'s `<LinearGradient colors={[...]}>` needs, not a CSS string. This is the same "small duplication over a shared file" trade-off already made for `mobile-theme.ts` (Round A), `toDailyLatest`, and `computeStreak` (Rounds B/C1) — extracted only if a third consumer ever needs it (YAGNI otherwise).

### `router.dismissTo` for the delete flow

Deleting an adventure from `[id]/edit.tsx` leaves both the edit screen and the Adventure Detail screen underneath it pointing at data that no longer exists. Rather than calling `router.back()` twice (fragile, assumes exact stack depth), the delete success handler calls `router.dismissTo("/(tabs)")` — an Expo Router API that navigates directly to a target route, dismissing every screen in between in one call. Confirmed available in this project's installed `expo-router` version (`node_modules/expo-router/build/global-state/router.d.ts` exports `dismissTo(href, options?)`).

## Data Flow

### Create (`new.tsx`)

- Local state: `title: string`, `paletteIdx: number` (default `0`), `saveState: { status: "idle" | "saving" | "error"; error?: string }`.
- Validation: `canCreate = title.trim().length >= 3` — matches the backend's `CreateAdventureSchema` (`title: z.string().min(3, ...)`) exactly, stricter than `apps/web`'s own creation form (which only checks non-empty and relies on the server's 400 to catch the 1-2 character case) — mobile does the better validation here.
- On submit: `POST /api/mobile/adventures` with `{ title: title.trim(), paletteIdx }` (no `description`, no `initialMissions`, per this round's Non-Goals). On success (`201`, body is the created `AdventureSummary`), navigate via `router.replace(\`/adventures/${created.id}\`)` — `replace`, not `push`, so the back button from the newly-created adventure's detail screen returns to the Dashboard, not to the now-stale creation form.
- On failure: inline error message under the form, form state preserved (same principle as the check-in wizard's save-failure path).

### Edit + Delete (`[id]/edit.tsx`)

- On mount: `GET /api/mobile/adventures/${id}` (the same endpoint Adventure Detail already uses) to prefill `title` and `paletteIdx`, and to capture `status` and `description` **unchanged** for later (see below). Same `loading` → `ready` → `error` pattern as every prior screen, with "Reintentar".
- Local state additionally: `saveState`, `deleteState: { status: "idle" | "deleting" | "error"; error?: string }`.
- On save: `PATCH /api/mobile/adventures/${id}` with `{ title: title.trim(), description: fetchedAdventure.description ?? undefined, status: fetchedAdventure.status, paletteIdx }` — `status` and `description` are sent back exactly as fetched, never edited by this screen (the backend's `UpdateAdventureSchema` requires `status` and treats `description` as optional-but-present-if-set; passing them through unchanged avoids silently clearing a `description` that might have been set via `apps/web`). On success, `router.back()` to Adventure Detail (whose `useFocusEffect` picks up the change).
- On delete: tapping "Eliminar aventura" shows a native `Alert.alert` with "Cancelar" / "Eliminar" (destructive style) buttons. Only on confirming: `DELETE /api/mobile/adventures/${id}` → on success, `router.dismissTo("/(tabs)")`. On failure, an inline error message is shown on the edit screen (no navigation), so the user can retry without losing their place.

## Error Handling

- **Load failure** (`edit.tsx`'s mount fetch fails): `isLoading` → `error` → content pattern, "Reintentar" re-runs the fetch.
- **Save failure** (create or edit): inline error message, form values preserved — same principle established in the check-in wizard (Round B).
- **Delete failure:** inline error message on the edit screen; no navigation happens until delete actually succeeds.
- **Delete confirmation cancelled:** no-op — the `DELETE` request is never sent unless the user explicitly confirms in the native alert.
- **401 / expired token:** already handled transparently by `apiRequest()` (auto-refresh), same as every prior round.

## Testing / Verification

No automated test framework exists in `apps/mobile` (consistent with every prior round). Verification is manual, same setup as Rounds A/B/C1:

1. Login → Dashboard → "+ Nueva aventura" button is visible above the adventures list.
2. Tap it → fill in a title (test the 3-character minimum: try 1-2 characters, confirm it's blocked client-side) and pick a palette → "Crear aventura" → lands directly on that new adventure's (empty) Adventure Detail screen.
3. Tap "< Volver" from there → returns to the Dashboard (not to the creation form), and the new adventure appears in the list.
4. From Adventure Detail, tap "Editar" → change the title and/or palette → "Guardar cambios" → returns to Adventure Detail showing the updated title/palette without a manual reload.
5. From the edit screen again, tap "Eliminar aventura" → confirms the native alert appears with Cancelar/Eliminar → tap "Cancelar" → nothing happens, still on the edit screen. Tap "Eliminar aventura" again → confirm this time → lands directly on the Dashboard, and the deleted adventure is gone from the list.
6. Server stopped: creating and editing both show their inline error state without crashing and without losing the typed title; restarting the server and retrying succeeds normally.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Duplicating the 5-entry `PALETTES` array (as hex arrays) in both `new.tsx` and `edit.tsx`, on top of `apps/web`'s own copy, risks three-way drift if a palette ever changes | Accepted — same trade-off already made for `mobile-theme.ts`/`toDailyLatest`/`computeStreak`; extract to a shared file only if a third `apps/mobile` consumer needs it |
| Sending `status`/`description` back unchanged on every edit relies on `edit.tsx`'s fetched copy staying accurate between mount and save (no concurrent edit from another device mid-session) | Acceptable for a single-user personal app with no realtime collaboration; not a scenario this app needs to guard against |
| `router.dismissTo` is a less-commonly-used Expo Router API than `push`/`back`/`replace` | Confirmed present and exported in the installed `expo-router` version before committing to this design (see Architecture section) |

## Future Work (explicitly deferred)

- Round A.5: port `sky-engine.ts` to React Native (separate, already-scoped future round).
- Round C2b: mission CRUD (create/edit/delete a mission within an adventure) — touches Adventure Detail, its own future spec.
- Exposing `description` and `status` editing in mobile, if ever needed — not requested for this round.
- A shared `packages/` workspace for theme/type/palette values if `apps/web`/`apps/mobile` drift becomes a real maintenance problem (same open item flagged in every prior round).
