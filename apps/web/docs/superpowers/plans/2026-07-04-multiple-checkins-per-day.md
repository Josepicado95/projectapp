# Multiple Check-Ins Per Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user submit more than one check-in per calendar day, each kept as an independent record, instead of the current "one check-in per day, later submissions overwrite it" behavior.

**Architecture:** `saveCheckIn` stops looking for an existing same-day record and always creates a new one. Everything that needs "today's status" (dashboard indicator, recommender) switches from "the only check-in today" to "the most recent check-in today." Everything that needs history (the `/progress` trend chart) needs no change — it already plots one point per array entry. The two "day of week" bar-strip widgets (`CheckInBody.tsx`, `ProgressBody.tsx`) both assume one record per day and need a shared fix.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, no new automated test framework (per project convention — verification is `tsc`, manual `curl`, and manual browser checks).

## Global Constraints

- Every `POST /api/mobile/checkins` creates a new `CheckIn` row — never updates an existing one.
- `GET /api/mobile/checkins?today=true` and the recommender both use the **most recent** check-in of the current calendar day, not "the only one."
- No database migration — `CheckIn` already has no `(userId, date)` uniqueness constraint and already stores a full `DateTime`.
- No cap on check-ins per day, no time-of-day labeling/tagging.
- Run all commands from `apps/web/`.
- No new automated test framework — verification is `tsc`, manual `curl`, and manual browser checks, consistent with `2026-07-03-web-api-migration-adventures.md`.
- Error responses keep the shape `{ "error": { "code": "...", "message": "..." } }` (unchanged — no route in this plan changes its error paths).

---

### Task 1: Backend — always create, "latest" instead of "today"

**Files:**
- Modify: `apps/web/lib/services/checkins.ts`
- Modify: `apps/web/app/api/mobile/checkins/route.ts`
- Modify: `apps/web/app/api/mobile/recommendations/route.ts`

**Interfaces:**
- Produces: `saveCheckIn(userId: number, input: CheckInInput): Promise<CheckInData>` (return type simplifies — no more `{ checkIn, created }`, every call is a creation). `getLatestCheckInToday(userId: number): Promise<CheckInData | null>` (renamed from `getTodayCheckIn`, same shape, now explicitly the most recent of the day via `orderBy: { date: "desc" }`).
- Consumed by: Task 2 (`CheckInBody.tsx` — no changes to its own `fetch` calls or the response shapes it parses, only the server-side behavior changes underneath it).

- [ ] **Step 1: Update `saveCheckIn` and rename `getTodayCheckIn`**

In `apps/web/lib/services/checkins.ts`, find:

```ts
export async function saveCheckIn(
  userId: number,
  input: CheckInInput
): Promise<{ checkIn: CheckInData; created: boolean }> {
  const existing = await prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
  });

  if (existing) {
    const checkIn = await prisma.checkIn.update({ where: { id: existing.id }, data: input });
    return { checkIn, created: false };
  }

  const checkIn = await prisma.checkIn.create({ data: { ...input, userId } });
  return { checkIn, created: true };
}
```

Replace with:

```ts
export async function saveCheckIn(userId: number, input: CheckInInput): Promise<CheckInData> {
  return prisma.checkIn.create({ data: { ...input, userId } });
}
```

Find:

```ts
export async function getTodayCheckIn(userId: number): Promise<CheckInData | null> {
  return prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
  });
}
```

Replace with:

```ts
export async function getLatestCheckInToday(userId: number): Promise<CheckInData | null> {
  return prisma.checkIn.findFirst({
    where: { userId, date: todayRangeUTC() },
    orderBy: { date: "desc" },
  });
}
```

`todayRangeUTC()` and the rest of the file (`listCheckIns`, `listRecentCheckIns`) are unchanged.

- [ ] **Step 2: Update the checkins API route**

In `apps/web/app/api/mobile/checkins/route.ts`, find:

```ts
import { saveCheckIn, listCheckIns, listRecentCheckIns, getTodayCheckIn } from "@/lib/services/checkins";
```

Replace with:

```ts
import { saveCheckIn, listCheckIns, listRecentCheckIns, getLatestCheckInToday } from "@/lib/services/checkins";
```

Find:

```ts
  if (params.get("today") === "true") {
    const checkIn = await getTodayCheckIn(userId);
    return apiSuccess({ checkIn });
  }
```

Replace with:

```ts
  if (params.get("today") === "true") {
    const checkIn = await getLatestCheckInToday(userId);
    return apiSuccess({ checkIn });
  }
```

Find:

```ts
  const { checkIn, created } = await saveCheckIn(userId, result.data);
  return apiSuccess(checkIn, created ? 201 : 200);
```

Replace with:

```ts
  const checkIn = await saveCheckIn(userId, result.data);
  return apiSuccess(checkIn, 201);
```

- [ ] **Step 3: Update the recommendations route**

In `apps/web/app/api/mobile/recommendations/route.ts`, find:

```ts
import { getTodayCheckIn } from "@/lib/services/checkins";
```

Replace with:

```ts
import { getLatestCheckInToday } from "@/lib/services/checkins";
```

Find:

```ts
  const todayCheckIn = await getTodayCheckIn(userId);
```

Replace with:

```ts
  const todayCheckIn = await getLatestCheckInToday(userId);
```

- [ ] **Step 4: Verify it compiles**

Run (from `apps/web/`): `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Verify with curl**

Start the dev server (`npm run dev`) if it isn't already running, then:

```bash
curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jose@aventuras.com","password":"aventuras123"}'
```

Copy the `accessToken`, then submit a first check-in:

```bash
curl -s -X POST http://localhost:3000/api/mobile/checkins \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"energy":3,"mood":3,"stress":3,"sleep":3}'
```

Expected: `201` with a JSON object (the created check-in, `energy`/`mood`/`stress`/`sleep` = 3).

Submit a second check-in the same day, with different values:

```bash
curl -s -X POST http://localhost:3000/api/mobile/checkins \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"energy":5,"mood":5,"stress":1,"sleep":5}'
```

Expected: `201` again (not `200`) — confirms the second submission was **created**, not merged into the first.

```bash
curl -s "http://localhost:3000/api/mobile/checkins?today=true" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: `{"checkIn":{...}}` with `energy: 5, mood: 5, stress: 1, sleep: 5` — the **second** (most recent) submission, confirming "today" now means "latest," not "only."

```bash
curl -s "http://localhost:3000/api/mobile/checkins?limit=5" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: a JSON array containing **both** check-ins from today (two separate objects, not one) — confirms neither submission overwrote the other.

- [ ] **Step 6: Commit**

```bash
git add lib/services/checkins.ts app/api/mobile/checkins/route.ts app/api/mobile/recommendations/route.ts
git commit -m "feat(checkins): create a new check-in per submission instead of upserting one per day"
```

---

### Task 2: `CheckInBody.tsx` — repeat check-ins, fixed week strip

**Files:**
- Create: `apps/web/lib/checkin-utils.ts`
- Modify: `apps/web/components/CheckInBody.tsx`

**Interfaces:**
- Produces: `toDailyLatest(checkIns: CheckInPoint[]): CheckInPoint[]` (exported from `lib/checkin-utils.ts`) — collapses a chronologically-ordered list of check-ins to at most one entry per calendar day, keeping the latest of each day.
- Consumed by: Task 3 (`ProgressBody.tsx` reuses the same function for its own week strip).
- Consumes: Task 1's unchanged API response shapes (`GET ?today=true` → `{ checkIn }`, `GET ?days=N` → array, `POST` → `201` with the created check-in).

- [ ] **Step 1: Create the shared day-collapsing helper**

Create `apps/web/lib/checkin-utils.ts`:

```ts
export type CheckInPoint = { date: string; energy: number; mood: number; stress: number; sleep: number };

/**
 * Collapses a list of check-ins — assumed ordered oldest-to-newest, one entry
 * per submission — to at most one entry per calendar day, keeping the latest
 * check-in of each day. Used by the "day of week" bar strips, which need one
 * value per day regardless of how many check-ins happened that day.
 */
export function toDailyLatest(checkIns: CheckInPoint[]): CheckInPoint[] {
  const byDay = new Map<string, CheckInPoint>();
  for (const c of checkIns) {
    byDay.set(c.date, c); // re-setting an existing key updates its value but keeps its original iteration position
  }
  return Array.from(byDay.values());
}
```

- [ ] **Step 2: Import the helper and `useCallback` in `CheckInBody.tsx`**

Find:

```tsx
import { useState, useEffect, useRef } from "react";
import ForestBackground from "@/components/ForestBackground";
```

Replace with:

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import ForestBackground from "@/components/ForestBackground";
import { toDailyLatest } from "@/lib/checkin-utils";
```

- [ ] **Step 3: Add a standalone "refresh this week's data" function**

Find:

```tsx
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
```

Replace with:

```tsx
  const formRef = useRef<HTMLFormElement>(null);

  // Deliberately NOT called from inside the effect below, and deliberately
  // duplicating that effect's own "fetch days=7, map, setRecentWeek" logic
  // rather than sharing it: the effect's `load()` must stay entirely
  // self-contained (never reference an externally-defined state-setting
  // function) to satisfy the `react-hooks/set-state-in-effect` lint rule —
  // same rule and fix pattern already established in DashboardBody.tsx /
  // AdventureDetailBody.tsx. This function is only ever called from the
  // plain event handler `handleSubmit`, never from an effect, so it's exempt.
  const refreshRecentWeek = useCallback(async () => {
    try {
      const weekRes = await fetch("/api/mobile/checkins?days=7");
      if (weekRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!weekRes.ok) return;
      const weekData: CheckInPoint[] = await weekRes.json();
      setRecentWeek(weekData.map((c) => ({
        date: c.date.slice(0, 10),
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        sleep: c.sleep,
      })));
    } catch {
      // Best-effort refresh — if this fails, the week strip just keeps
      // showing the last known data until the next successful refresh.
    }
  }, []);

  useEffect(() => {
```

- [ ] **Step 4: Call it after a successful submit, and simplify the success message**

Find:

```tsx
      setSaveState({
        status: "success",
        message: res.status === 201 ? "¡Check-in guardado!" : "¡Check-in actualizado!",
      });
      setStep(5);
    } catch {
```

Replace with:

```tsx
      setSaveState({ status: "success", message: "¡Check-in guardado!" });
      setStep(5);
      refreshRecentWeek();
    } catch {
```

- [ ] **Step 5: Add a "start a new check-in" reset function**

Find:

```tsx
  function goTo(next: number, dir: "forward" | "back") {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
  }
```

Replace with:

```tsx
  function goTo(next: number, dir: "forward" | "back") {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
  }

  function startNewCheckIn() {
    setValues({ energy: 3, mood: 3, stress: 3, sleep: 3 });
    setSaveState({ status: "idle" });
    goTo(0, "back");
  }
```

- [ ] **Step 6: Fix the week-bar strip to collapse to one entry per day**

Find:

```tsx
  const now = new Date();
  const todayDow = now.getDay();
  const weekBars = recentWeek.slice(-7).map((c, i, arr) => {
```

Replace with:

```tsx
  const now = new Date();
  const todayDow = now.getDay();
  const weekBars = toDailyLatest(recentWeek).slice(-7).map((c, i, arr) => {
```

- [ ] **Step 7: Add the "Hacer otro check-in" button to the success screen**

Find:

```tsx
              <a href="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background:"linear-gradient(135deg,#E3A878 0%,#C8885A 100%)", textDecoration:"none", borderRadius:14, padding:15, boxShadow:"0 8px 24px rgba(227,168,120,.3)" }}>
                <span>Ver mi dashboard</span><span style={{ fontSize:17 }}>→</span>
              </a>
            </div>
          )}
```

Replace with:

```tsx
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={startNewCheckIn}
                  style={{ flex:1, fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#ECE6D8", background:"rgba(236,230,216,.08)", border:"1px solid rgba(236,230,216,.18)", borderRadius:14, padding:15, cursor:"pointer" }}>
                  Hacer otro check-in
                </button>
                <a href="/" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background:"linear-gradient(135deg,#E3A878 0%,#C8885A 100%)", textDecoration:"none", borderRadius:14, padding:15, boxShadow:"0 8px 24px rgba(227,168,120,.3)" }}>
                  <span>Ver mi dashboard</span><span style={{ fontSize:17 }}>→</span>
                </a>
              </div>
            </div>
          )}
```

- [ ] **Step 8: Verify it compiles**

Run (from `apps/web/`): `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 9: Manual browser verification**

1. Log in, go to `/checkin`. If you already have a check-in for today (e.g., from Task 1's curl testing), you land on the success screen for it.
2. Click **"Hacer otro check-in"** — expect the form to reset to the first question (not still showing old slider values).
3. Answer the 4 questions with different values than before, submit. Expect the success screen again, showing your new values, with both buttons present.
4. Click **"Hacer otro check-in"** a second time, submit a third check-in.
5. Go back to the intro screen (reload `/checkin` or navigate away and back) — confirm the "tu semana" bar strip still shows exactly 7 (or fewer, if you're new) **distinct days**, correctly labeled, not extra/duplicate days from today's multiple check-ins.

- [ ] **Step 10: Commit**

```bash
git add lib/checkin-utils.ts components/CheckInBody.tsx
git commit -m "feat(checkins): allow starting another check-in same day, fix week strip for multiple same-day check-ins"
```

---

### Task 3: `ProgressBody.tsx` — fix its week strip, verify the trend chart needs nothing

**Files:**
- Modify: `apps/web/components/ProgressBody.tsx`

**Interfaces:**
- Consumes: `toDailyLatest` from `apps/web/lib/checkin-utils.ts` (Task 2).

- [ ] **Step 1: Import the shared helper**

Find:

```tsx
"use client";

import ForestBackground from "@/components/ForestBackground";
```

Replace with:

```tsx
"use client";

import ForestBackground from "@/components/ForestBackground";
import { toDailyLatest } from "@/lib/checkin-utils";
```

- [ ] **Step 2: Fix the week-bar strip to collapse to one entry per day**

Find:

```tsx
  // Last 7 days bars
  const last7 = checkIns.slice(-7);
  const todayDow = now.getDay();
  const weekBars = last7.map((c, i) => {
```

Replace with:

```tsx
  // Last 7 days bars — collapse to one entry per calendar day first, since
  // checkIns may contain multiple check-ins for the same day.
  const last7 = toDailyLatest(checkIns).slice(-7);
  const todayDow = now.getDay();
  const weekBars = last7.map((c, i) => {
```

Note: the `metrics` computation above this (the trend sparkline, built from `checkIns.map(c => c[m.key])`) is **not touched** — it already plots one point per array entry with no day-grouping, so it will automatically show every individual check-in, including multiple same-day ones, once `checkIns` legitimately contains them. That's the intended "see variation within a day" behavior, and it requires no code change.

- [ ] **Step 3: Verify it compiles**

Run (from `apps/web/`): `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Manual browser verification**

1. After Task 2's manual testing (which should have left 3+ check-ins for today), go to `/progress`.
2. Confirm the trend chart (sparkline) for each metric (Energía, Ánimo, Estrés, Sueño) shows the extra points from today's multiple check-ins — the line should visibly move between them, not just show one flat value for today.
3. Confirm the "tu semana" bar strip still shows the correct 7 distinct days with correct day-of-week labels (same check as Task 2's Step 9.5, from `/progress` instead of `/checkin`).

- [ ] **Step 5: Commit**

```bash
git add components/ProgressBody.tsx
git commit -m "fix(progress): collapse week-strip to one entry per day when multiple check-ins share a day"
```

---

## Self-Review Notes

- **Spec coverage:** every architecture item (A–E) and edge case from `2026-07-04-multiple-checkins-per-day-design.md` maps to a task step above. The "concurrent submissions" edge case needs no task — it's a natural consequence of Task 1 removing the read-then-write branch, not something to implement separately.
- **Scope check:** `app/progress/page.tsx` (the server component that queries Prisma directly for `/progress`) needs no changes — it doesn't import `getTodayCheckIn`/`saveCheckIn`, and already passes `checkIns` as an ordered, day-truncated array, which is exactly what `toDailyLatest` expects.
- **Type consistency:** `CheckInPoint` in `lib/checkin-utils.ts` matches the shape already used identically (but locally re-declared) in both `CheckInBody.tsx` and `ProgressBody.tsx` (`{ date: string; energy: number; mood: number; stress: number; sleep: number }`) — the existing local type aliases in those two files are left as-is (structurally identical, so they satisfy `toDailyLatest`'s parameter type without needing to import `CheckInPoint` itself).
