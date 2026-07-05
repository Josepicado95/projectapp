# Mobile Scaffold + Login — Design Spec
**Date:** 2026-07-05
**Status:** Approved

---

## Overview

This is sub-project 2 of the larger "mobile version" initiative (sub-project 1 was the `/api/mobile/*` JSON API in `apps/web`, already built and in production use by the web frontend itself). This spec covers building the initial Expo/React Native app at `apps/mobile`: the project scaffold, a minimal navigation shell, and a complete login → session → logout cycle wired against the existing auth API.

This is deliberately **not** the full mobile app. Dashboard, adventure detail, check-in, and progress screens are each their own future sub-project, following the same pattern already used for the web API migration (`/checkin` and `/adventures` were separate PRs, not one mega-migration).

## Goals

- A working Expo app at `apps/mobile` (TypeScript, Expo Router, NativeWind), independent of `apps/web`'s dependencies (own `package.json`, like `apps/recommender`).
- Full auth lifecycle wired end-to-end against the existing `/api/mobile/auth/*` endpoints: login, secure token storage, silent session restore on app relaunch, automatic access-token refresh on expiry, logout.
- A minimal tab shell that proves navigation + auth work together: a "Home" placeholder showing "Hola, {nombre}" (fetched via `GET /auth/me`, confirming the token round-trip actually works) and a "Profile" placeholder with a logout button.
- Verifiable on Jose's physical phone via Expo Go, talking to the Next.js dev server running on his PC over the local Wi-Fi network.

## Non-Goals

- Dashboard (adventure list), adventure detail, check-in, and progress screens — each a separate future sub-project.
- Push notifications, offline support, deep linking.
- Automated tests — manual verification only, consistent with this project's existing convention (`apps/web` has no JS test runner either; CI only runs `tsc` + lint).
- EAS Build / app store submission — this sub-project targets local development via Expo Go only.
- CORS handling — not applicable. Native `fetch` calls from the Expo app aren't browser-mediated, so CORS (a browser-enforced mechanism) doesn't apply. Would only become relevant if testing via the Expo web preview, which is out of scope here.

---

## Architecture

New, independent project at `apps/mobile/` — not part of an npm workspace shared with `apps/web` (mirrors how `apps/recommender` is its own independent Python project).

```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Root layout: wraps the app in AuthProvider, redirects to /login or (tabs)
│   ├── login.tsx            # Login screen
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator, only reachable when authenticated
│       ├── index.tsx        # "Hola, {nombre}" placeholder — proves the token works
│       └── profile.tsx      # Placeholder with a "Cerrar sesión" button
├── lib/
│   ├── api.ts                # fetch wrapper: attaches Authorization header, handles refresh-on-401
│   ├── auth-context.tsx      # React Context: { user, accessToken, login(), logout() }
│   └── secure-store.ts       # thin wrapper over expo-secure-store
├── .env.example               # EXPO_PUBLIC_API_URL
├── app.json
├── package.json
└── tsconfig.json
```

Generated via `npx create-expo-app@latest apps/mobile` (current default template already ships TypeScript + Expo Router), then NativeWind is added on top for styling, matching the Tailwind classes already used in `apps/web`.

**Navigation:** Expo Router (file-based routing — each file under `app/` is a route), the same mental model as `apps/web`'s Next.js App Router. Chosen over manually-configured React Navigation to reuse a pattern Jose already knows, rather than introducing a second, unrelated navigation paradigm.

**Styling:** NativeWind (Tailwind for React Native) over plain `StyleSheet.create`, so Tailwind vocabulary and the project's existing warm/motivating color palette carry over directly instead of being re-derived in a different styling API.

**Token storage:** `expo-secure-store` — the device's encrypted keychain (iOS Keychain / Android Keystore). Plain `AsyncStorage` is not an option for tokens: it's unencrypted, readable by anything with device/app access.

---

## Auth & Data Flow

**App launch:** `app/_layout.tsx` reads `accessToken`/`refreshToken` from `expo-secure-store` on mount. If a `refreshToken` is present, the app assumes an active session and Expo Router redirects into `(tabs)`; otherwise it redirects to `/login`. This mirrors the SSR guard pattern already used in `apps/web` (`if (!session?.user) redirect("/login")`), except the guard runs client-side here since there's no server rendering the screen.

**Login:** `login.tsx` calls `POST /api/mobile/auth/login` (existing endpoint, already verified against by curl in a previous session) → stores `accessToken` + `refreshToken` in secure-store → updates `AuthContext` → Expo Router navigates to `(tabs)`.

**Protected requests** (e.g. `GET /auth/me` on the Home placeholder) go through `lib/api.ts`, which:
1. Attaches `Authorization: Bearer <accessToken>` automatically.
2. On `401 token_expired`: calls `POST /auth/refresh` once, stores the rotated token pair, retries the original request.
3. If the refresh itself fails (refresh token expired/revoked): clears secure-store and redirects to `/login` with a "Tu sesión expiró, inicia sesión de nuevo" message.

**Logout:** the "Cerrar sesión" button on `profile.tsx` calls `POST /auth/logout` (revokes the refresh token server-side, existing endpoint) → clears secure-store → redirects to `/login`.

---

## Error Handling

- **Invalid credentials** (`401 invalid_credentials`): show the API's own Spanish `message` under the login form.
- **Can't reach the server** (misconfigured `EXPO_PUBLIC_API_URL`, or the PC's firewall blocking the connection): generic message — "No se pudo conectar. Revisa que tu celular y tu PC estén en la misma red Wi-Fi."
- **Session genuinely expired** (refresh attempt also fails): clear everything, redirect to `/login` with "Tu sesión expiró, inicia sesión de nuevo."

---

## Testing / Verification

No automated test framework (consistent with project convention) — manual verification via Expo Go:

1. Open the app with no stored session → lands on `/login`.
2. Wrong password → visible error message.
3. Correct login → navigates to `(tabs)`; "Hola, {nombre}" shows the real name (confirms `GET /auth/me` round-tripped correctly with the issued token).
4. Force-quit and reopen the app → still logged in (token persisted in secure-store).
5. Logout → returns to `/login`; reopening the app afterward does not silently log back in.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Expo Go not yet installed on Jose's phone | First implementation step: install from the store (Android/iOS) before anything else |
| Phone can't reach `localhost:3000` (it's a separate device from the PC running the dev server) | Use the PC's LAN IP (e.g. `192.168.1.23:3000`) in `EXPO_PUBLIC_API_URL`, not `localhost` |
| Windows Firewall blocks the incoming connection from the phone on first run | Walk through allowing Node.js / the port through Windows Firewall if the connection is refused |
| Scope creep into dashboard/other screens while "just adding one more thing" | Explicitly out of scope (see Non-Goals) — each subsequent screen is its own future sub-project with its own spec |

---

## Future Work (explicitly deferred)

- Dashboard (adventure list) screen — own spec.
- Adventure detail + missions screen — own spec.
- Check-in screen — own spec.
- Progress screen — own spec.
- EAS Build / app store distribution.
- Push notifications, offline support, deep linking.
