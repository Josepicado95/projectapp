# Mobile Check-In (Round B) — Design Spec
**Date:** 2026-07-06
**Status:** Approved

---

## Overview

This is **Round B** of "Sub-project 3" (the mobile dashboard/misiones initiative from `ROADMAP.md`'s Fase 15), following **Round A** (Dashboard + Adventure Detail, implemented and merged via PR #9). Round B adds the check-in submission flow: a multi-step wizard where the user rates energy, mood, stress, and sleep (1-5 each) and saves it, against the already-shipped `/api/mobile/checkins` endpoint (no backend changes).

Round B's goal: the user can tap "Hacer check-in" from the Dashboard, answer 4 quick questions one at a time, see a summary, and have their streak on the Dashboard reflect the new check-in immediately upon return — mirroring the existing `apps/web` check-in wizard (`CheckInBody.tsx`) both in flow and in re-visit behavior (jump straight to summary if already checked in today).

## Non-Goals

- Editing or deleting a past check-in — only creating today's.
- Any historical check-in visualization beyond the existing 7-day strip already used for this flow (14-day trend chart / per-metric history is the Progress screen, Round C).
- Adventure/mission CRUD, Progress screen (Round C).
- Porting `sky-engine.ts` (Round A.5) — this round continues using `mobile-theme.ts`'s flat gradients, per the established Round A pattern.
- Any change to `apps/web` or `/api/mobile/checkins` — this round is a pure consumer of the existing, already-shipped endpoint.
- A shared data-fetching hook between the Dashboard and check-in — the check-in screen is self-contained, same principle Round A established for Adventure Detail (avoid a "God hook").
- Automated tests (no test framework exists in `apps/mobile`, per established convention — manual verification via Expo Go on a physical phone).

## Architecture

### Navigation

- `src/app/(tabs)/index.tsx` (Dashboard, modified) — gains a "Hacer check-in" button/card that navigates via `router.push("/checkin")`, and a `useFocusEffect` that calls the existing `useDashboardData()`'s `refetch()` every time the Home tab regains focus (covers: returning from check-in, and the general case of switching tabs away and back).
- `src/app/checkin.tsx` (new) — the check-in wizard, living **outside** the `(tabs)` group (same pattern as `adventures/[id].tsx`), pushed as a stack screen with an automatic back button.

### New files

```
apps/mobile/src/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx   # modified: "Hacer check-in" entry point + useFocusEffect refetch
│   └── checkin.tsx     # new: check-in wizard screen
```

No new files under `src/lib/` — this screen reuses `apiRequest`/`ApiError` (`@/lib/api`), `getMobileMoment` (`@/lib/mobile-theme`), and `CheckInData` (`@/lib/types`), all from Round A. It does not introduce a `use-checkin-data.ts` hook — the screen's own local state (`step`, `values`, `todayCheckIn`, `weekStrip`, `isLoading`, `error`, `saveState`) is enough, following Adventure Detail's precedent of "self-contained screen, no shared hook" for single-consumer logic.

### Refresh mechanism (chosen over an explicit cross-screen signal)

`useFocusEffect` (from `expo-router`, re-exporting React Navigation's hook) is the idiomatic way to say "this screen's data may be stale whenever the user looks at it again" — it fires on every focus, including the return from `/checkin` via the back button. The alternative (an event emitter or shared store where the check-in screen explicitly signals "saved") was considered and rejected: it's more precise (avoids a redundant refetch when the user merely switches tabs without checking in) but adds a new cross-screen coordination mechanism for a marginal savings on a cheap endpoint. YAGNI applies.

## Data Flow

### On mount (`checkin.tsx`)

Parallel fetch, mirroring `useDashboardData()`'s `Promise.all` pattern:

```ts
const [todayRes, weekRes] = await Promise.all([
  apiRequest<{ checkIn: CheckInData | null }>("/api/mobile/checkins?today=true"),
  apiRequest<CheckInData[]>("/api/mobile/checkins?days=7"),
]);
```

- If `todayRes.checkIn` is non-null (already checked in today): initialize `values` from it and jump straight to **step 5 (summary)** — same behavior as `apps/web`'s `CheckInBody.tsx` (`if (todayData.checkIn) { setValues(...); setStep(5); }`).
- Otherwise: start at **step 0 (intro)**, with the 7-day strip rendered from `weekRes` (same bar-chart-from-average-of-3-metrics logic as web's `weekBars` computation, adapted to React Native views instead of styled `div`s).

### Wizard steps (local `step: number`, 0-5, matching web's model exactly)

- **Step 0 — Intro:** greeting, date, the 7-day strip (if any data), "Empezar" button → step 1.
- **Steps 1-4 — one metric each** (energy, mood, stress, sleep, same order/copy as web): a 1-5 dot selector (same tappable-circle component pattern already used for the mission list in Adventure Detail — no new UI primitive, no slider library), "Atrás"/"Siguiente" buttons. `values` starts at `{ energy: 3, mood: 3, stress: 3, sleep: 3 }`, matching web's default.
- **Step 4's "Siguiente" is instead "Guardar check-in":** submits via `POST /api/mobile/checkins` with `values`. On success: `setStep(5)`.
- **Step 5 — Summary:** shows the 4 values with their labels, "Hacer otro check-in" (resets `values` to `3`s and `step` to `0`) and "Volver al Dashboard" (`router.back()`).

## Error Handling

- **Load failure** (today/week fetch fails on mount): same `isLoading` → `error` → content pattern as Dashboard/Adventure Detail, with a "Reintentar" button re-running the mount fetch.
- **Save failure** (`POST` fails on step 4): unlike the mission toggle's optimistic-revert-in-silence approach, this is a deliberate, user-awaited action — show an inline error message under the "Guardar" button (mirroring web's `saveState.status === "error"` banner) **without** advancing to step 5 and **without** clearing `values`, so the user can retry without re-answering the 4 questions.
- **401 / expired token:** already handled transparently by `apiRequest()` (auto-refresh) — this round's code never needs to think about it.

## Testing / Verification

No automated test framework exists in `apps/mobile` (consistent with Round A). Verification is manual, same setup as Round A (`npm run dev` in `apps/web`, `npx expo start` in `apps/mobile`, same LAN):

1. Login → Dashboard → "Hacer check-in" button is visible.
2. Complete the wizard (intro → 4 metrics → guardar) → summary shows the 4 correct values.
3. "Volver al Dashboard" → the streak already reflects today's check-in (confirms `useFocusEffect` fired).
4. Re-enter `/checkin` → jumps straight to the summary (already checked in today), not the wizard from scratch.
5. "Hacer otro check-in" from the summary → returns to the intro with `values` reset to `3`s.
6. Server stopped: graceful error state (no crash) both on screen load and on save-attempt, with wizard answers preserved in the save-failure case.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `useFocusEffect` refetching on every tab focus (not just after a real check-in) adds redundant network calls | Accepted — the endpoints involved are cheap and already used elsewhere; not worth the added complexity of an explicit cross-screen signal (see Architecture) |
| Duplicating the wizard's step/values logic from `apps/web`'s `CheckInBody.tsx` risks drifting out of sync over time | Same accepted trade-off as `mobile-theme.ts` in Round A — `apps/mobile` and `apps/web` are separate npm projects with no shared package infrastructure; revisit only if drift becomes a real problem (YAGNI otherwise) |
| Save-failure path must not clear `values` | Called out explicitly here and will be called out again in the implementation plan as a specific detail to get right, same treatment Round A gave the toggle's revert-by-id logic |

## Future Work (explicitly deferred)

- Round A.5: port `sky-engine.ts` to React Native (separate, already-scoped future round).
- Round C: Adventure/mission CRUD + Progress screen (which will show the 14-day historical trend chart, distinct from this round's simple 7-day strip).
- A shared `packages/` workspace for theme/type/wizard-copy values if `apps/web`/`apps/mobile` drift becomes a real maintenance problem (same open item Round A already flagged).
