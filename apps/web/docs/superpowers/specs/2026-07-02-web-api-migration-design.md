# Web Frontend → Mobile API Migration — Design Spec
**Date:** 2026-07-02
**Status:** Approved

---

## Overview

Migrate the web app's data-mutating and data-fetching UI from Next.js Server Actions (`app/actions/*`) to the JSON API built in the `mobile-api` sub-project (`/api/mobile/*`). After this migration, both the web app and the future native mobile app go through the exact same API surface — there is a single path into the business logic, authenticated differently per caller (session cookie for same-origin web, Bearer JWT for mobile).

This is sub-project 2 of the "mobile version" initiative (see `2026-07-01-mobile-api-design.md` for sub-project 1). It directly resolves the "Option B" question that sub-project 1 explicitly deferred.

## Goals

- Every component currently calling an `app/actions/*` Server Action instead calls the corresponding `/api/mobile/*` route via `fetch()`.
- One authentication system serves both callers: `withMobileAuth` accepts either a valid `Authorization: Bearer <JWT>` (mobile) or a valid NextAuth session cookie (same-origin web request) — no new token type introduced for the browser.
- Dead code removed: once a resource is migrated and manually verified, its old Server Action is deleted, not kept as a parallel path.
- No visual/UX redesign — same screens, same behavior, different plumbing underneath.

## Non-Goals

- Redesigning any screen's visual appearance.
- Touching `apps/recommender` (Python) — `/api/mobile/recommendations` already proxies to it unchanged.
- The Expo/React Native app itself (separate future spec, per sub-project 1).
- Adding a refresh-token dance to the web app — web auth stays cookie-based; if the session cookie is invalid/expired, the client redirects to `/login`, same as today.
- Automated tests (manual browser verification per resource, consistent with sub-project 1's YAGNI stance).

---

## Prerequisite / Sequencing

This design builds directly on `lib/mobile-auth.ts`, `withMobileAuth`, and the service layer (`lib/services/*`) from sub-project 1, which currently live on the unmerged branch `worktree-mobile-api`. That branch's Modo B review cycle (code walkthrough + active review exercise + checkpoint) must complete and the branch must be merged to `main` before implementation of this spec begins — this migration should not be built on code the user hasn't reviewed yet.

---

## Architecture

### A) Dual-mode auth in `withMobileAuth`

`withMobileAuth` is extended to resolve `userId` from either credential, trying Bearer first:

```
withMobileAuth(handler):
  1. Authorization: Bearer <token> present? → verify JWT → userId
  2. Else, valid NextAuth session cookie present? → read userId from session
  3. Neither valid → 401, reusing the existing codes (`missing_token` if no
     credential of either kind was present, `token_expired` if a Bearer
     token was present but invalid/expired)
  4. → handler(req, { userId })
```

Route handlers are unaware of which path authenticated the request — same input/output contract regardless of caller. This is the only change to already-built API code; everything else in this migration is frontend-only.

### B) Per-component migration pattern (applies uniformly across all 4 resources)

Each component currently using `<form action={serverAction}>`:

1. Becomes (or isolates into) a `"use client"` component.
2. Manages its own request state via `useState`: `status: "idle" | "loading" | "success" | "error"` plus an error message string.
3. On submit: `event.preventDefault()`, then `fetch('/api/mobile/...', { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(...) })`.
4. On response: if `res.ok`, update local state / re-fetch the affected list; if not, parse `{ error: { code, message } } ` and surface `message` inline.

This replaces the loading/error handling Next.js currently provides for free via `useFormState`/`useFormStatus` — written by hand here, by design (explicit learning goal).

### C) Migration + deletion order

Strictly incremental, one resource at a time, each with its own Modo B cycle (explanation → code → active review → checkpoint) before moving to the next:

1. **Auth (register only)** — `AuthCard.tsx`'s register form → `/api/mobile/auth/register`. `login`/`logout` stay as Server Actions unchanged: they are NextAuth session mechanics (`signIn()`/`signOut()` create/clear the session cookie the dual-mode auth bridge depends on), not duplicated business logic — `signIn`'s `authorize()` callback already calls the same `verifyCredentials` service. Migrating them to the JSON API would return a JWT but never set the session cookie, breaking the web app's own auth.
2. **Adventures** — `AdventureCard.tsx`, `AdventureEditorModal.tsx`, `NewAdventurePanel.tsx`, `NewAdventureForm.tsx`, `DashboardBody.tsx`, `app/page.tsx` → `/api/mobile/adventures*`
3. **Missions** — `MissionItem.tsx`, `MissionEditorModal.tsx`, `NewMissionForm.tsx` → `/api/mobile/adventures/:id/missions`, `/api/mobile/missions/:id`
4. **Check-ins** — `CheckInBody.tsx`, `CheckInForm.tsx`, `app/progress/page.tsx` → `/api/mobile/checkins`

Within each resource: (1) build the new client component against the API, (2) manually verify it in the browser against every screen it affects, (3) only once confirmed working, delete the corresponding Server Action from `app/actions/*` and its now-unused imports. The old and new paths never coexist for more than one working step.

---

## Data Flow

Example (adventures list on the dashboard):

- **Before:** `DashboardBody.tsx` (Server Component) calls the Server Action directly during server-side render.
- **After:** `DashboardBody.tsx` becomes a client component; `useEffect` fires a `fetch('/api/mobile/adventures')` on mount (browser sends the NextAuth session cookie automatically, same-origin); result goes into `useState`; a loading state renders until the first response arrives. Create/update/delete follow the same fetch → update-local-state → re-render loop.

## Error Handling

Reuses the existing API error contract (`{ error: { code, message } }`) — no new error codes. Special case: a `401` response means the NextAuth session is invalid/expired; the client redirects to `/login` rather than showing an inline error, matching current behavior when a session lapses. All other error codes render as an inline message using the existing `message` string (already Spanish, already user-safe).

## Testing

The API itself was already verified via curl in sub-project 1 — not repeated here. Verification for this migration is manual, per migrated component: exercise the happy path (create/edit/complete/delete, as applicable) and one error path (e.g., empty required field) in the browser, confirming behavior matches the pre-migration screen. No new automated test framework (same YAGNI stance as sub-project 1).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Building on unreviewed `worktree-mobile-api` code | Hard prerequisite: that branch's Modo B review + merge to `main` happens first (see Sequencing) |
| `withMobileAuth`'s new cookie path accidentally accepts a stale/invalid NextAuth session as valid | Reuse NextAuth's own session-verification call (`auth()`), don't hand-roll cookie parsing/validation |
| A component migrated to client-side fetch loses Server Component benefits it had (e.g. no-JS rendering, initial server-rendered HTML) | Accepted trade-off, explicitly in scope of this migration — flagged here so it's a conscious choice, not a surprise |
| Partial migration state (some resources on Server Actions, some on API) confuses future contributors | Migration order + deletion-after-verification (see Architecture C) ensures each resource fully flips before the next starts, minimizing how long mixed state exists |

## Future Work (explicitly deferred)

- Migrating web login itself off NextAuth cookies entirely (would only make sense if a compelling reason emerges — not needed today since Option 1 keeps NextAuth as-is).
- Optimistic UI updates (update local state before the fetch resolves) — not required for parity with current behavior.
