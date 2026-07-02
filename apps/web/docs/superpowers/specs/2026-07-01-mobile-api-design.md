# Mobile API — Design Spec
**Date:** 2026-07-01
**Status:** Approved

---

## Overview

Add an HTTP JSON API to `apps/web` so a future native mobile client (React Native / Expo, built in a later sub-project) can consume the same data and business logic the web app already has, without changing how the existing web app works.

This is sub-project 1 of the larger "mobile version" initiative. Sub-projects 2+ (Expo app scaffold, mobile screens, mobile-specific background visuals) are out of scope here and will get their own specs.

---

## Goals

- Full feature parity with what the web app can already do: auth, adventures CRUD, missions CRUD, check-ins, recommendations.
- Zero behavior change for the existing web app (same Server Actions, same session-cookie login).
- No duplicated business logic between web and mobile — both go through a shared Service layer.
- Token-based auth suitable for a native client (access token + refresh token, DB-backed refresh tokens so logout/revocation is real).
- Stay inside the existing monorepo / existing `apps/web` deploy — no new service to stand up.

## Non-Goals

- Building the actual Expo/React Native app (separate future spec).
- Migrating the web frontend off Server Actions onto this API (explicitly deferred — see "Future Work").
- Automated tests (manual curl/HTTPie testing for this iteration — see "Testing").
- Refresh token reuse detection/alerting, rate limiting, multi-device session listing UI (mentioned as future hardening, not built now).

---

## Dependencies

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

`zod` is already imported throughout `app/actions/*` but is missing from `package.json` (works today only because it's hoisted as a transitive dependency of something else). Add it explicitly:

```bash
npm install zod
```

New environment variable: `MOBILE_JWT_SECRET` (separate from Auth.js's own secret, so the two auth systems don't share key material).

---

## Architecture

### Principle: shared Service layer

Business logic gets extracted out of `app/actions/*` into plain, framework-agnostic functions. Both the existing (now thinner) Server Actions and the new Route Handlers call the same functions:

```
Web form  → Server Action (thin: parse FormData, call service, map to ActionState)  ─┐
                                                                                        ├─→ lib/services/* (the real logic)
Mobile app → Route Handler (thin: parse JSON, call service, map to NextResponse)  ────┘
```

A Service function takes already-validated primitives plus a `userId`, talks to Prisma, and returns data or throws a typed error (`NotFoundError`, `ValidationError`, `ConflictError`). It doesn't know or care whether it was called from a form or from JSON.

### File structure

```
apps/web/
├── lib/
│   ├── services/
│   │   ├── adventures.ts     # listAdventures, getAdventure, createAdventure, updateAdventure, deleteAdventure
│   │   ├── missions.ts       # createMission, updateMission, deleteMission
│   │   ├── checkins.ts       # saveCheckIn, listCheckIns
│   │   ├── auth.ts           # verifyCredentials, registerUser
│   │   └── errors.ts         # NotFoundError, ValidationError, ConflictError
│   └── mobile-auth.ts        # signAccessToken, verifyAccessToken, issueRefreshToken,
│                              # rotateRefreshToken, revokeRefreshToken
├── app/
│   ├── actions/               # existing files, edited to call lib/services/* instead of Prisma directly
│   │   ├── adventures.ts
│   │   ├── missions.ts
│   │   ├── checkins.ts
│   │   └── auth.ts
│   └── api/
│       └── mobile/
│           ├── auth/
│           │   ├── register/route.ts
│           │   ├── login/route.ts
│           │   ├── refresh/route.ts
│           │   ├── logout/route.ts
│           │   └── me/route.ts
│           ├── adventures/
│           │   ├── route.ts                  # GET list, POST create
│           │   └── [id]/
│           │       ├── route.ts               # GET detail, PATCH, DELETE
│           │       └── missions/route.ts       # POST create mission
│           ├── missions/[id]/route.ts          # PATCH, DELETE
│           ├── checkins/route.ts               # GET history, POST upsert today
│           └── recommendations/route.ts        # GET
└── prisma/
    └── schema.prisma          # + RefreshToken model
```

### Auth wrapper

`withMobileAuth(handler)` in `lib/mobile-auth.ts` reads the `Authorization: Bearer <token>` header, verifies it, and calls `handler(req, { userId })`. Every protected route in `app/api/mobile/**` is wrapped with it instead of repeating the check.

---

## Data Model

```prisma
model RefreshToken {
  id        Int       @id @default(autoincrement())
  tokenHash String    @unique
  userId    Int
  user      User      @relation(fields: [userId], references: [id])
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())
}
```

Add `refreshTokens RefreshToken[]` to `User`.

The raw refresh token is never stored — only its hash (`sha256`, not `bcrypt`: the token is a high-entropy random string, not a low-entropy guessable secret like a password, so a fast cryptographic hash is sufficient and avoids unnecessary CPU cost). `revokedAt` is `null` while active; set on rotation or logout.

---

## Auth Token Lifecycle

1. **Register / Login** — server issues an **access token** (JWT, signed with `MOBILE_JWT_SECRET`, `sub` = userId, 15 min expiry) and a **refresh token** (random 32-byte string, 30 day expiry, hash stored in `RefreshToken`). Both returned once in the response body.
2. **Protected request** — client sends `Authorization: Bearer <accessToken>`. `withMobileAuth` verifies signature + expiry, extracts `userId`.
3. **Access token expires** — next protected request gets `401 { error: { code: "token_expired" } }`. Client should attempt a refresh, not immediately force re-login.
4. **`POST /api/mobile/auth/refresh`** — client sends `{ refreshToken }`. Server hashes it, looks it up, checks not expired/revoked. If valid: **rotates** it (marks the used one `revokedAt = now`, issues and stores a brand new refresh token + a new access token). Client replaces both locally. If invalid: `401`, client must log in again.
5. **`POST /api/mobile/auth/logout`** — client sends its current refresh token; server marks it revoked. Note: the access token itself can't be revoked server-side (stateless JWT) — it simply expires within 15 minutes, which is the accepted trade-off of this design.

---

## Endpoints

All under `/api/mobile`. `Bearer` = requires valid access token via `withMobileAuth`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create user → `{accessToken, refreshToken, user}` |
| POST | `/auth/login` | — | Verify credentials → `{accessToken, refreshToken, user}` |
| POST | `/auth/refresh` | refreshToken in body | Rotate → new `{accessToken, refreshToken}` |
| POST | `/auth/logout` | refreshToken in body | Revoke that refresh token |
| GET | `/auth/me` | Bearer | Current user `{id, name, email}` |
| GET | `/adventures` | Bearer | List user's adventures (with mission counts) |
| POST | `/adventures` | Bearer | Create (optionally with initial missions) |
| GET | `/adventures/:id` | Bearer | Detail + missions. `404` if not found/not owned |
| PATCH | `/adventures/:id` | Bearer | Update title/description/status/palette |
| DELETE | `/adventures/:id` | Bearer | Delete (and its missions) |
| POST | `/adventures/:id/missions` | Bearer | Create mission under adventure |
| PATCH | `/missions/:id` | Bearer | Update / toggle completed |
| DELETE | `/missions/:id` | Bearer | Delete mission |
| GET | `/checkins?limit=7` | Bearer | Check-in history |
| POST | `/checkins` | Bearer | Upsert today's check-in |
| GET | `/recommendations` | Bearer | Proxy to the Python recommender, same fallback behavior as the web dashboard |

---

## Error Handling

Consistent JSON shape on every error response:

```json
{ "error": { "code": "invalid_credentials", "message": "Correo o contraseña incorrectos" } }
```

- `code` — stable machine-readable string the mobile client can branch on (e.g. `token_expired` → try refresh).
- `message` — Spanish, human-readable, safe to show directly.

Status codes: `400` validation (zod `safeParse` failures), `401` auth problems (missing/invalid/expired access token, bad credentials, invalid refresh token), `404` not found or not owned by the caller, `409` conflict (e.g. email already registered), `500` unexpected (logged server-side, generic message to client).

---

## Testing

Manual, via curl/HTTPie, endpoint by endpoint, during implementation. `apps/web` has no JS test runner today (CI only runs `tsc` + lint for it); adding one is deferred until there's a broader reason to (YAGNI). Revisit if/when the mobile app itself needs integration tests.

---

## Implementation Order

1. Prisma migration: add `RefreshToken` model.
2. `lib/services/errors.ts` + `lib/mobile-auth.ts` (token sign/verify/rotate/revoke helpers).
3. Extract `lib/services/auth.ts` from `app/actions/auth.ts` and `auth.ts`; wire `/api/mobile/auth/*` routes.
4. Extract `lib/services/adventures.ts` + `lib/services/missions.ts`; refactor their Server Actions to use them; wire the corresponding `/api/mobile/*` routes.
5. Extract `lib/services/checkins.ts`; refactor its Server Action; wire `/api/mobile/checkins`.
6. Wire `/api/mobile/recommendations` (reuses existing `lib/recommender.ts`).
7. Manual end-to-end curl pass through the full lifecycle: register → login → protected call → wait for expiry or force it → refresh → protected call → logout → confirm refresh token now rejected.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Refactoring Server Actions to use the new Service layer breaks existing web behavior | Do one resource at a time (adventures, then missions, then checkins), manually re-test that resource's web screens immediately after each extraction, before moving to the next |
| `MOBILE_JWT_SECRET` missing/weak in production | Add to `.env.example` with a comment; document as a required Vercel env var before this ships |
| Access token payload leaks sensitive data if decoded (JWTs are signed, not encrypted) | Keep payload minimal — just `sub` (userId) and standard claims (`iat`, `exp`) |
| Refresh token table grows unbounded (old expired/revoked rows never cleaned up) | Acceptable for now at this scale; note as future cleanup (scheduled job or query filter), not built in this pass |

---

## Future Work (explicitly deferred)

- The Expo/React Native app itself (`apps/mobile`) — separate spec.
- Migrating the web frontend to also consume this API instead of Server Actions ("Option B" discussed and explicitly deferred by the user).
- Refresh token reuse detection (alert/revoke-all if a revoked refresh token is presented again — signal of theft).
- Rate limiting on `/auth/*` endpoints.
- Automated tests for the Service layer.
