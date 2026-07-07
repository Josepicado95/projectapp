# Mobile Progress (Round C1) — Design Spec
**Date:** 2026-07-06
**Status:** Approved

---

## Overview

This is **Round C1** of "Sub-project 3" (the mobile dashboard/misiones initiative from `ROADMAP.md`'s Fase 15), following **Round A** (Dashboard + Adventure Detail, merged via PR #9) and **Round B** (check-in wizard, merged via PR #10). The originally-planned "Round C" (CRUD + Progress) was split at brainstorming time into two independent rounds — this spec covers only the read-only Progress screen; CRUD (create/edit/delete adventures and missions) becomes its own **Round C2**, with its own future spec.

Round C1's goal: a read-only "Mi Progreso" screen mirroring `apps/web`'s `ProgressBody.tsx` — per-metric 14-day trend (bars instead of SVG sparklines, no new dependency), a 7-day strip, streak, and per-adventure completion cards (up to 5, most recent first) that link into Adventure Detail — pulled from the already-shipped `/api/mobile/*` backend, no backend changes.

## Non-Goals

- Create/edit/delete adventures or missions — that's Round C2.
- SVG sparklines / any charting library (`react-native-svg` or similar) — flat bars only, matching the simple-first precedent set by Round A (flat gradients instead of the 3D sky engine) and Round B (dot selectors instead of a slider library).
- Listing each adventure's individual missions on its Progress card — the card shows only a completion bar and "`X` de `Y` misiones"; the full mission list stays exclusive to Adventure Detail (avoids duplicating that list across two screens, per the same screen-boundary principle Round A established between Dashboard and Adventure Detail).
- A shared data-fetching hook — this screen is self-contained, same principle as Adventure Detail and the check-in screen.
- Any change to `apps/web` or `/api/mobile/*` — pure consumer of already-shipped endpoints.
- Automated tests (no test framework exists in `apps/mobile`) — manual verification via Expo Go.

## Architecture

### Navigation

- `src/app/(tabs)/index.tsx` (Dashboard, modified) — gains a "Ver mi progreso" button/card, navigating via `router.push("/progress")`. Placed alongside the existing "Hacer check-in" entry point.
- `src/app/progress.tsx` (new) — the Progress screen, living **outside** the `(tabs)` group (same pattern as `checkin.tsx` and `adventures/[id].tsx`), pushed as a stack screen.

### New files

```
apps/mobile/src/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx    # modified: "Ver mi progreso" entry point
│   └── progress.tsx     # new: Progress screen
```

No new files under `src/lib/`. This screen reuses, unchanged, from prior rounds: `apiRequest`/`ApiError` (`@/lib/api`), `getMobileMoment` (`@/lib/mobile-theme`), and both `AdventureDetail` and `CheckInData` (`@/lib/types`). Confirmed against the actual backend service code (`apps/web/lib/services/adventures.ts`'s `listAdventuresWithMissions`) that `GET /api/mobile/adventures?include=missions` returns exactly the `AdventureDetail[]` shape already defined — no new or modified type needed.

The screen also needs its own local copies of two small pure functions that already exist elsewhere in `apps/mobile` but aren't shared via `src/lib/` (consistent with this codebase's established pattern of small, screen-local duplication over premature shared abstraction — see Round A's `mobile-theme.ts` note and Round B's `toDailyLatest`):
- `computeStreak(checkIns)` — identical to the one in `(tabs)/index.tsx`.
- `toDailyLatest(checkIns)` — identical to the one in `checkin.tsx` (dedupes same-day check-ins before computing the 7-day strip, avoiding the exact bug Round B's review caught and fixed).

## Data Flow

### On mount (`progress.tsx`)

Parallel fetch, mirroring the pattern from every prior round:

```ts
const [adventuresRes, checkInsRes] = await Promise.all([
  apiRequest<AdventureDetail[]>("/api/mobile/adventures?include=missions"),
  apiRequest<CheckInData[]>("/api/mobile/checkins?days=14"),
]);
```

### Metric cards (energy, mood, stress, sleep)

For each metric, using the 14-day `checkIns` window:
- **Bars:** one bar per day (deduped via `toDailyLatest`, oldest to newest, up to 14), height proportional to that day's value (1-5) — same bar-rendering technique as the check-in screen's week strip, just with up to 14 bars instead of 7 and no day-label row (this screen shows trend shape, not specific days).
- **Average:** `series.reduce((a,b) => a+b, 0) / series.length`, rounded to 1 decimal; `0` if the series is empty.
- **Trend arrow:** ported verbatim from `apps/web/components/ProgressBody.tsx`'s `trendInfo()` — compares the average of the last `n` days against the first `n` days (`n = min(5, floor(series.length / 2))`), returns `↑`/`↓`/`→` with a threshold of `0.25`. For the `stress` metric, the comparison direction is inverted (a stress *decrease* is the positive direction) — same `inverted` flag web uses.

### 7-day strip

Same computation as `checkin.tsx`'s week strip: `toDailyLatest(checkIns).slice(-7)`, bar height/color from `(energy + mood + sleep) / 3`.

### Streak

`computeStreak(checkIns)` — identical logic to the Dashboard's, duplicated locally in this screen (see Architecture).

### Adventure cards

`adventures.slice(0, 5)` (already ordered most-recent-first by the backend's `orderBy: { createdAt: "desc" }`), each rendering: title, a completion bar (`missions.filter(m => m.completed).length / missions.length`, `0%` if there are no missions), "`X` de `Y` misiones" text. Tapping a card navigates to `/adventures/${id}` (the existing Round A route) — same interaction pattern as the Dashboard's adventure cards.

## Error Handling

- **Load failure** (either fetch fails): same `isLoading` → `error` → content pattern as every screen so far, with a "Reintentar" button re-running the mount fetch.
- **No adventures yet:** friendly empty state ("Todavía no tienes aventuras"), matching the Dashboard's existing copy.
- **No check-ins in the 14-day window:** metric cards show `0` average and a neutral `→` arrow — matches `apps/web`'s existing behavior for an empty series, not a special error state.
- **This screen has no write path** — no save/toggle interactions, so none of the optimistic-update or save-failure handling from Adventure Detail / check-in applies here.

## Testing / Verification

No automated test framework exists in `apps/mobile` (consistent with every prior round). Verification is manual, same setup as Rounds A and B (`npm run dev` in `apps/web`, `npx expo start` in `apps/mobile`, same LAN):

1. Login → Dashboard → "Ver mi progreso" button is visible.
2. Tap it → Progress screen loads: 4 metric cards (each with a bar row, average, and trend arrow), a 7-day strip, a streak number, and up to 5 adventure cards with completion bars.
3. Numbers match what's already visible elsewhere in the app (the streak matches the Dashboard's; the adventure completion percentages match what's shown inside each Adventure Detail).
4. Tap an adventure card → navigates to its Adventure Detail screen; "Volver" (or hardware/gesture back) returns to Progress.
5. Server stopped: Progress shows the "No se pudo cargar" retry state, not a crash; restarting the server and tapping "Reintentar" recovers.
6. (Optional, environment-dependent per prior rounds' experience) If the same pre-existing `fetch`-timeout issue reproduces on server-down testing, note it as confirmation of the known, already-documented debt — not a Round C1 defect.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Duplicating `computeStreak`/`toDailyLatest` a third/second time (already exist in `(tabs)/index.tsx` and `checkin.tsx` respectively) risks the two copies drifting apart over time | Accepted — same trade-off already made twice before in this codebase (`mobile-theme.ts` duplication vs. web, `toDailyLatest` local to `checkin.tsx`); revisit only if a real divergence bug appears (YAGNI otherwise). If a fourth consumer ever needs either function, that's the trigger to extract a shared `src/lib/` module — not before. |
| Porting `trendInfo()`'s threshold/inversion logic by hand could subtly diverge from web's behavior | Called out explicitly here with the exact formula and threshold (`0.25`), so the implementation plan can transcribe it verbatim rather than re-deriving it |

## Future Work (explicitly deferred)

- Round A.5: port `sky-engine.ts` to React Native (separate, already-scoped future round).
- Round C2: CRUD (create/edit/delete) for adventures and missions — touches the Dashboard (new-adventure entry point) and Adventure Detail (edit/delete actions), its own future spec.
- `react-native-svg` / real sparkline charts, if the flat-bar approach ever feels insufficient (no evidence of that need yet).
- A shared `packages/` workspace for theme/type/utility-function values if `apps/web`/`apps/mobile` drift becomes a real maintenance problem (same open item flagged in Rounds A and B).
