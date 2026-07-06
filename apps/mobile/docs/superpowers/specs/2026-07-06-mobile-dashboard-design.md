# Mobile Dashboard (Read + Toggle) — Design Spec
**Date:** 2026-07-06
**Status:** Approved

---

## Overview

This is **Round A** of "Sub-project 3" (the mobile dashboard/misiones initiative from `ROADMAP.md`'s Fase 15). The full initiative was too large for one spec — Jose chose to split it into smaller rounds, each with its own spec → plan → implementation cycle:

- **Round A (this spec):** Dashboard (adventures + missions + streak + recommendations, read-only except for toggling a mission's completed state) + Adventure Detail screen.
- **Round A.5 (separate, future):** port `apps/web/lib/sky-engine.ts`'s animated sky to React Native (`expo-gl`/Three.js) — a self-contained graphics problem, deliberately decoupled from this round so it can't block the dashboard's data/UI work.
- **Round B (future):** the Check-in flow (multi-step slider form).
- **Round C (future):** create/edit/delete (CRUD) for adventures and missions, plus the Progress screen.

Round A's goal: the user opens the app and sees their real adventures, missions, streak, and today's recommendations — pulled live from the existing `/api/mobile/*` backend (built in an earlier sub-project) — and can tap into an adventure's detail and mark missions complete. No creation/editing/deletion of adventures or missions yet, no check-in submission, no progress charts.

## Non-Goals

- Create/edit/delete adventures or missions (Round C).
- The check-in submission flow (Round B). Check-in *data* is read (for streak/week strip), but there's no form to submit a new check-in from mobile yet.
- The Progress screen (per-adventure completion charts, 14-day trend) — Round C.
- Porting `sky-engine.ts` / any animated 3D background (Round A.5). This round uses flat/gradient colors only.
- Any change to `apps/web` or the `/api/mobile/*` backend — this round is a pure consumer of the existing, already-shipped API.
- Automated tests (no test framework exists in `apps/mobile`, per established convention — manual verification via Expo Go on a physical phone).

## Architecture

### Navigation

- `src/app/(tabs)/index.tsx` — currently a placeholder ("Hola, {nombre}") from the scaffold sub-project — becomes the real Dashboard screen.
- `src/app/adventures/[id].tsx` (new) — Adventure Detail screen, living **outside** the `(tabs)` group (same pattern as `login.tsx`), pushed via `router.push(`/adventures/${id}`)` from the Dashboard. Expo Router stacks it above the tabs with an automatic back button.
- `src/app/(tabs)/profile.tsx` — unchanged (logout already works, from the scaffold sub-project).

### New files

```
apps/mobile/src/
├── lib/
│   ├── types.ts              # AdventureSummary, AdventureDetail, MissionData, CheckInData, Recommendation
│   ├── use-dashboard-data.ts # data-fetching hook for the Dashboard screen
│   └── mobile-theme.ts       # flat/gradient colors per moment of day (independent of apps/web's theme.ts)
├── app/
│   ├── (tabs)/
│   │   └── index.tsx         # rewritten: real Dashboard
│   └── adventures/
│       └── [id].tsx          # new: Adventure Detail
```

### `mobile-theme.ts`

`apps/mobile` is a separate npm project from `apps/web` — no shared code between them. This file is a **small, independent** re-implementation covering only what this round needs: a `MomentKey` type (`"manana" | "tarde" | "atardecer" | "noche"`) and a `getMobileMoment(hour: number)` function returning a background color (or a 2-stop gradient, using `expo-linear-gradient` which is already a transitive Expo dependency) plus a couple of text/card colors — reusing the same color values Jose already knows from the web's `theme.ts`, just without the `glassBg`/`glassBgStrong`/aurora/parallax fields that only make sense for the Three.js engine. The moment is computed from the phone's local time directly (`new Date().getHours()`) — no server round-trip needed, unlike the web (which reads a request header); the phone always knows its own local time.

## Data Flow

### `src/lib/types.ts`

TypeScript types matching the API's actual response shapes (verified against current route handler code, not just the older mobile-api spec, which slightly undersells the check-ins endpoint's current behavior):

```ts
export type AdventureSummary = {
  id: number; title: string; description: string | null;
  status: string; paletteIdx: number;
}; // what GET /adventures returns — the Dashboard only ever needs this shape

export type MissionData = {
  id: number; adventureId: number; title: string; description: string | null;
  difficulty: number; completed: boolean;
};

export type AdventureDetail = AdventureSummary & {
  missions: MissionData[];
}; // what GET /adventures/:id returns — only Adventure Detail needs this shape

export type CheckInData = {
  id: number; date: string; energy: number; mood: number; stress: number; sleep: number;
};

export type Recommendation = { id: number; title: string; difficulty: number; reason: string };
```

### `src/lib/use-dashboard-data.ts`

A custom hook — a function starting with `use` that can call other hooks internally (`useState`, `useEffect`) — encapsulating "how to get the dashboard's data" so the screen component only handles "how to draw it":

```ts
function useDashboardData() {
  // useEffect fires 3 requests in parallel on mount:
  //   GET /adventures                (summaries only — no ?include=missions, Dashboard doesn't show missions)
  //   GET /checkins?days=14          (for streak + week strip)
  //   GET /recommendations
  // Returns: { adventures, checkIns, recommendations, isLoading, error, refetch }
}
```

The Dashboard's hook has no `toggleMission` — since the Dashboard no longer shows individual missions (see Screens below), toggling lives entirely in the Adventure Detail screen instead, as its own local piece of logic (not a shared hook, since only one screen needs it):

```ts
// inside adventures/[id].tsx
async function toggleMission(missionId: number) {
  // 1. optimistically flip `completed` in local state
  // 2. PATCH /missions/:id { completed }
  // 3. on failure: revert that specific mission (by id) back, show a brief error
}
```

### Screens

Each screen has exactly one job — no inline expand/collapse on the Dashboard (unlike the web, which expands an adventure's missions in place; mobile instead navigates in, the more idiomatic mobile pattern):

- **Dashboard (`(tabs)/index.tsx`):** calls `useDashboardData()`. Renders: a list of adventure **cards only** (title, status, a progress indicator derived from its missions — no missions shown here), tappable to navigate to that adventure's detail screen; a streak number derived from `checkIns`; a recommendations section (or the backend's fallback `message` when empty).
- **Adventure Detail (`adventures/[id].tsx`):** calls `GET /adventures/:id` directly (own local loading/error state — no need to share the dashboard's hook). This is the **only** screen with the mission list and the toggle-complete interaction — renders title/description/status/progress bar + mission list, each mission tappable to toggle.

## Error Handling

- **401 / expired token:** already handled transparently by `apiRequest()` (auto-refresh, single-flight-safe as of the prior fix) — this round's code never needs to think about it.
- **Network failure / server down:** `useDashboardData()` captures the error; Dashboard shows a "No se pudo cargar, reintentar" state with a button calling `refetch()` — same pattern already used in `login.tsx`.
- **No adventures yet:** a friendly empty state instead of a blank list.
- **Toggle fails:** optimistic update reverts, brief inline error shown.
- **Empty recommendations:** the backend already guarantees `{recommendations: [], message: "..."}` (never a hard error) — the screen just displays that message.

## Testing / Verification

No automated test framework exists in `apps/mobile` (consistent with the rest of this sub-project). Verification is manual: run against the real backend (`npm run dev` in `apps/web`, `npx expo start` in `apps/mobile`, both on the same LAN per the scaffold sub-project's established setup), log in with the test account (`jose@aventuras.com`), and confirm real adventures/missions/streak/recommendations render, tapping into an adventure's detail works, toggling a mission persists across a reload, and the empty/error states can be triggered and look reasonable (e.g. by temporarily stopping the `apps/web` dev server to see the retry state).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `useDashboardData()` becomes a "God hook" if Round B/C's needs get folded into it later | Keep it scoped strictly to what Round A needs (adventures+missions, check-ins for streak, recommendations); Round B/C add their own hooks rather than growing this one |
| Optimistic toggle + revert logic is easy to get subtly wrong (e.g. reverting the wrong mission if multiple toggles happen quickly) | Revert by mission ID from the specific failed request's closure, not from a shared "last toggled" variable — plan will call this out explicitly as an implementation detail to get right |
| `mobile-theme.ts` duplicating web's color values by hand risks drifting out of sync over time | Acceptable for now (two separate npm projects, no shared package infrastructure exists) — noted as a candidate for a shared `packages/` workspace *if* this drift becomes a real problem later (YAGNI otherwise) |

## Future Work (explicitly deferred)

- Round A.5: port `sky-engine.ts` to React Native via `expo-gl`/`expo-three` or `@react-three/fiber` — note the texture-factory functions (`makeCloudTexture`, `makeStreakTexture`, `makeGlowTexture`) use `document.createElement('canvas')`/`CanvasRenderingContext2D`, which don't exist in React Native, and will need a different solution (e.g. pre-baked static texture assets) — flagged now so it isn't a surprise when that round starts.
- Round B: Check-in submission flow.
- Round C: Adventure/mission CRUD (create, edit, delete) + Progress screen.
- A shared `packages/` workspace for theme/type values if `apps/web` and `apps/mobile` color/type drift becomes a real maintenance problem.
