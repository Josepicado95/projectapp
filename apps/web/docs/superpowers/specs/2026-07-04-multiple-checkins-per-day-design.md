# Multiple Check-Ins Per Day — Design Spec
**Date:** 2026-07-04
**Status:** Approved

---

## Overview

Today, `saveCheckIn` finds the existing check-in for the current calendar day (if any) and updates it — there is exactly one `CheckIn` record per user per day, and the `/checkin` page has no way to re-open the form once you've submitted for the day. This spec changes that: every submission creates a new, independent `CheckIn` record, so a user can log how their energy/mood/stress/sleep change throughout the day (e.g., once in the morning, once at night) and see that variation later.

The `CheckIn` table already has no uniqueness constraint on `(userId, date)` and already stores a full `DateTime` (not just a date) — both are accidental properties of the current schema (previously flagged as unreviewed tech debt) that turn out to be exactly what this feature needs. No database migration is required.

## Goals

- Every `POST /api/mobile/checkins` submission creates a new record — never updates an existing one.
- Anything that needs "today's status" (the dashboard's check-in indicator, the recommender) uses the **most recent** check-in of the day.
- Anything that needs history (the `/progress` trend chart, the "tu semana" bar strips) correctly reflects multiple same-day check-ins without misdating other days.
- The user can trigger another check-in from the success screen without navigating away first.
- No cap on check-ins per day.

## Non-Goals

- No schema changes (no migration needed).
- No labeling/tagging of check-ins by time-of-day slot (e.g., "morning"/"evening") — each check-in is just a timestamped record; the user picks when to check in.
- No rate limiting or cooldown between check-ins.
- No changes to the recommender's algorithm itself (`apps/recommender`) — it keeps receiving one check-in's worth of input, just now explicitly "the latest," not "the only."

---

## Architecture

### A) Service layer (`lib/services/checkins.ts`)

- `saveCheckIn(userId, input)`: removes the "find existing today, then update" branch. Always `prisma.checkIn.create({ data: { ...input, userId } })`. Return type simplifies to `Promise<CheckInData>` (no more `created` boolean — every call is a creation).
- `getTodayCheckIn` is renamed to `getLatestCheckInToday(userId)`: same "today" date-range filter as before, but adds `orderBy: { date: "desc" }` and takes the first result, making "which one" explicit and correct rather than whatever Postgres happened to return first.
- `listCheckIns` / `listRecentCheckIns`: unchanged — already list-shaped, already tolerate multiple same-day records without modification.

### B) API routes

- `GET /api/mobile/checkins?today=true`: internally calls `getLatestCheckInToday` instead of `getTodayCheckIn`. Response shape is unchanged (`{ checkIn: CheckInData | null }`) — only the meaning shifts, from "the only one" to "the most recent." No consumer needs to change how it parses this response.
- `POST /api/mobile/checkins`: same request/response contract. Since `saveCheckIn` never updates anymore, the route always returns `201 Created` (the `created ? 201 : 200` branch collapses to always-201).
- `GET /api/mobile/checkins?days=N` / `?limit=N`: unchanged — already return arrays; multiple same-day check-ins simply appear as multiple array entries.
- `GET /api/mobile/recommendations`: swaps `getTodayCheckIn` for `getLatestCheckInToday`, so recommendations are always computed from the user's most recent check-in of the day.

### C) Frontend — `components/CheckInBody.tsx`

- Success screen (`step === 5`) gains a **"Hacer otro check-in"** button alongside the existing "Ver mi dashboard" link. It resets all form state (`values`, `step`, etc.) back to the initial step so the user can log a new entry immediately.
- The success message simplifies to a fixed `"¡Check-in guardado!"` (the `res.status === 201 ? ... : ...` ternary is removed — the response is always 201 now).
- After a successful submission, the component re-fetches its own "recent week" data (same `refresh()`-style pattern already used elsewhere in this app) so that if the user immediately does another check-in in the same visit, the "tu semana" bar strip reflects the just-submitted value rather than the stale data fetched on page load.
- **Bug fix required for this feature to work correctly:** `weekBars` (the "tu semana" bar strip) currently assumes one record per calendar day — it maps `recentWeek.slice(-7)` by array index directly to a day-of-week offset. With multiple check-ins on the same day, this breaks (e.g., 3 check-ins today would incorrectly appear to span 3 different days). Fixed by collapsing the check-in list to one value per calendar day (using the latest check-in of each day) *before* computing the week strip — see shared helper below.

### D) Frontend — `components/ProgressBody.tsx`

- The main trend chart (sparkline, built from `checkIns.map(c => c[m.key])`) requires **no changes** — it already plots one point per array element with no day-grouping logic, so it will naturally show every check-in as its own point once the API starts returning multiple same-day records. This directly delivers the "see variation within a day" goal with zero code change.
- The "tu semana" bar strip here has the exact same one-record-per-day assumption bug as `CheckInBody.tsx`'s, and needs the same fix.

### E) Shared helper

Rather than duplicating the "collapse to one value per calendar day, keeping the latest" logic in both `CheckInBody.tsx` and `ProgressBody.tsx`, extract it once — e.g. `toDailyLatest(checkIns: CheckInPoint[]): CheckInPoint[]` in a shared location (`lib/checkins.ts` client-side helper, or co-located with the two components if there's no existing shared client-utils file for this domain — exact location decided at plan time). Both components' week-strip code calls this before doing their day-of-week offset math.

---

## Edge Cases

- **New user, never checked in:** `getLatestCheckInToday` returns `null`; dashboard indicator stays on, recommendations show the existing "haz tu check-in" message — unchanged from today.
- **Dashboard streak calculation:** already groups check-ins into a `Set` keyed by calendar day (see `DashboardBody.tsx`'s `fetchDashboardSnapshot`), so it already tolerates multiple same-day check-ins without modification.
- **Concurrent submissions:** removing the "find existing, then update" branch removes a small pre-existing read-then-write race window; every submission is now a plain, independent `create` with no race condition to reason about.

## Testing / Verification

Consistent with this project's existing approach (no new automated test framework): `npx tsc --noEmit`, `npx eslint .`, and manual browser verification — specifically, submitting 2-3 check-ins in one sitting and confirming the trend chart shows separate points, the "tu semana" strips still label the correct days, and recommendations update to reflect the latest submission.
