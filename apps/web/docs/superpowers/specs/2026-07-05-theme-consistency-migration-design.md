# Theme Consistency Migration — Design Spec
**Date:** 2026-07-05
**Status:** Approved

---

## Overview

Jose reported a real visual bug: the Check-in and Progress pages always show a night sky, regardless of the actual time of day, while the Dashboard correctly shows the sky matching the user's local hour (dawn/noon/dusk/night). Investigating the root cause revealed the problem is bigger than "wrong background prop":

- `ForestBackground.tsx` (used by `CheckInBody.tsx` and `ProgressBody.tsx`) is a legacy wrapper around `ThreeBackground`/`SkyCanvas` that hardcodes `moment="noche"` — a leftover from before `sky-engine.ts` had 4 moments, when the background was a single fixed night scene ("ForestScene").
- Even where the sky *is* wired correctly (`AdventureDetailBody.tsx`, via `momentKey` passed down from `apps/web/app/adventures/[id]/page.tsx`), the page's own chrome (glass panels, headline text) is still hardcoded to a dark/night palette. Only `DashboardBody.tsx` is fully time-of-day-aware today: both its sky *and* its two main glass panels react to `theme.*`.
- The exact "compute the user's local hour from the request, map to a `MomentTheme`" logic is duplicated verbatim in `apps/web/app/page.tsx` and `apps/web/app/adventures/[id]/page.tsx`, and is simply missing from `apps/web/app/checkin/page.tsx` and `apps/web/app/progress/page.tsx`.

Jose chose to bring **all three** non-Dashboard pages (Check-in, Progress, Adventure Detail) up to Dashboard's level, rather than only fixing Check-in/Progress and leaving Adventure Detail as a "correct sky, fixed panels" outlier once the other two are consistent.

## The Reference Pattern (already shipped, in `DashboardBody.tsx`)

Read closely, Dashboard does **not** make everything moment-dependent — it draws a specific, deliberate line. This spec follows that same line, not a blanket "replace every hex with `theme.*`":

**Moment-dependent (uses `theme.*`, changes with dawn/noon/dusk/night):**
- The sky itself: `<ThreeBackground moment={theme.key} />`.
- The page's 1–2 main "glass card" containers: background (`theme.glassBg`), border (`theme.glassBorder`), shadow (`theme.glassShadow`, `theme.glassInner`).
- Text inside those glass panels: big headline/greeting (`theme.headerInk`, `theme.headerSub`), body/label text (`theme.cardInk`, `theme.cardSub`).
- Track/chip backgrounds behind progress bars, inputs, unselected pills (`theme.trackBg`).
- The round avatar/logout button (`theme.avatarBg`, `theme.avatarInk`).

**Fixed regardless of moment (stays hardcoded — confirmed by reading Dashboard's own code, not assumed):**
- Nav rail and bottom nav backgrounds — literally `rgba(10,15,26,.66)` / `rgba(10,15,26,.88)` in **all four** components today, Dashboard included. This is a deliberate "device chrome" frame, not part of the moment palette.
- Semantic/category colors: the four check-in metrics (energy `#E3A878`, mood `#7EB8D8`, stress `#C48FB4`, sleep `#7E9A86`), mission difficulty tier colors, XP/level colors (`LEVELS` in Dashboard), the streak flame accent, error red (`#F0A0A0`/`rgba(220,80,80,...)`), success/positive green (`#7E9A86` used as a "good trend" indicator). These represent what a value *means*, not what time it is — they must not change with the moment.
- Small fixed UI accents used for navigation and interactive chrome: e.g. `#7EB8D8`/`#CDE6F5`/`#9FB4C6` for nav links and back-links. These are already consistent across all four components and are not part of `MomentTheme`.

## Non-Goals

- `DashboardBody.tsx` and `app/page.tsx` — already correct, not touched.
- The nav rail / bottom nav visual design — confirmed fixed-by-design (see above), not migrated to `theme.*`.
- `sky-engine.ts` / `SkyCanvas.tsx` — no changes; this migration only changes which `moment` gets passed in and which panel colors read from `theme.*`.
- `apps/mobile` — untouched, this is a web-only visual consistency fix.
- Adding new automated visual regression tooling (no such tooling exists in this repo today).
- Reworking the semantic/category color system (metrics, XP levels, mission difficulty) — explicitly out of scope, these stay fixed.

## Addendum (2026-07-05, discovered during Task 3): `AuthCard.tsx` is in scope after all

Task 3's implementer found that `ForestBackground.tsx` has a second consumer this spec didn't originally account for: `components/AuthCard.tsx` (the login/register screen, rendered by `app/login/page.tsx` and `app/register/page.tsx`). This spec originally assumed Check-in + Progress were `ForestBackground`'s only importers.

Jose's decision: extend the migration to `AuthCard.tsx` too (Option B — full consistency across every page, not just the four already covered), rather than leaving `ForestBackground.tsx` alive as a login-only exception. This becomes Task 5; `ForestBackground.tsx`'s deletion moves from Task 3 to Task 5 (it can only be deleted once it truly has zero importers).

### `AuthCard.tsx` mapping

| Current (hardcoded) | Becomes |
|---|---|
| `<ForestBackground static />` | `<ThreeBackground moment={theme.key} isStatic />` |
| "Dawn curtain" reveal overlay gradient (hardcoded to the night `skyGradient`) | `theme.skyGradient` — same treatment as Progress's reveal curtain (Task 3 precedent) |
| Glass card background `rgba(12,18,30,.84)` (a primary/foreground card) | `theme.glassBgStrong` |
| Glass card border `rgba(236,230,216,.16)` | `theme.glassBorder` |
| Title ("Bienvenido de vuelta" / "Empieza tu aventura") `#F2EFE6` | `theme.headerInk` |
| Subtitle `#7A8FA0` | `theme.headerSub` (mirrors Dashboard's greeting+subtext pairing) |
| Mode-toggle prompt text `#7A8FA0` | `theme.cardSub` |
| Form inputs: text `#ECE6D8`, background `rgba(236,230,216,.07)`, border `rgba(236,230,216,.18)` | `theme.cardInk`, `theme.trackBg`, `theme.glassBorder` — mirrors Dashboard's search-input treatment (`DashboardBody.tsx`'s search input already uses exactly this trio) |
| "Transition curtain" (fixed gradient shown for 700ms after a successful login, before redirecting) | `theme.skyGradient`, for the same consistency reason as the dawn curtain — low visual stakes given how brief it is, implementer discretion if this feels like overkill |
| **NOT changed (semantic/brand, not moment-dependent):** the primary CTA button gradient (`#E3A878`/`#C8885A` — the app's fixed brand accent, no Dashboard equivalent exists to mirror, treated like the always-fixed nav-link accents); the logo/wordmark circle (`radial-gradient(... #F0EAD8, #9DB6A4)` — a static brand mark, not a user avatar); error banner colors (red) and the "cuenta creada" success banner (green) — both match the existing error/success color pattern from Check-in/Progress; divider line/"o" label opacpoint — very low-emphasis chrome, implementer discretion, leaning toward leaving fixed | stays hardcoded |

**Files touched:** `app/login/page.tsx`, `app/register/page.tsx` (both need the same `getRequestMoment()` + `?hour=` wiring as the other pages — currently neither is even `async`), `components/AuthCard.tsx`.

## Architecture

### Shared `getRequestMoment()` helper

`apps/web/app/page.tsx` and `apps/web/app/adventures/[id]/page.tsx` currently duplicate this exact block:

```ts
const reqHeaders = await headers();
const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const localHour = parseInt(
  new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
  10
);
const theme = getMoment(localHour);
```

Extract this into `apps/web/lib/get-request-moment.ts`:

```ts
import { headers } from "next/headers";
import { getMoment, type MomentTheme } from "./theme";

export async function getRequestMoment(): Promise<MomentTheme> {
  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  return getMoment(localHour);
}
```

Server-only (uses `next/headers`, which throws if called from a Client Component) — all four page-level Server Components (`app/page.tsx`, `app/checkin/page.tsx`, `app/progress/page.tsx`, `app/adventures/[id]/page.tsx`) call this instead of re-deriving the timezone/hour logic themselves.

### Prop threading

- `CheckInBody.tsx` and `ProgressBody.tsx` currently accept no theme-related prop at all. Both gain a `theme: MomentTheme` prop, following `DashboardBody`'s exact pattern (not just `momentKey` — they need the full palette for their panels, same as Dashboard).
- `AdventureDetailBody.tsx` currently accepts `momentKey: MomentKey` (just the key, used only for the sky). It changes to accept `theme: MomentTheme` instead (superset — `theme.key` replaces the old `momentKey` for the `ThreeBackground` call), so its panels can also read `theme.*`.
- Each page (`checkin/page.tsx`, `progress/page.tsx`, `adventures/[id]/page.tsx`) calls `getRequestMoment()` and passes the result as `theme`.
- `ForestBackground.tsx` import is removed from `CheckInBody.tsx` and `ProgressBody.tsx`, replaced with `ThreeBackground` (already used correctly by Dashboard/AdventureDetail) called as `<ThreeBackground moment={theme.key} />`. `CheckInBody.tsx` and `ProgressBody.tsx` are `ForestBackground.tsx`'s only two consumers (confirmed by grep during this spec's research) — once both are migrated, `ForestBackground.tsx` has zero remaining importers and is deleted as part of this migration (matching this project's established practice of not leaving dead code behind, per the mobile-scaffold sub-project's final review).

### Concrete mapping (per component)

**`CheckInBody.tsx`:**
| Current (hardcoded) | Becomes |
|---|---|
| `<ForestBackground static />` | `<ThreeBackground moment={theme.key} isStatic />` |
| `cardStyle`/`loadingCardStyle` background `rgba(14,20,36,.84)`, border `rgba(236,230,216,.16)` | `theme.glassBg`, `theme.glassBorder` |
| Greeting "Hola, {nombre}" color `#F2EFE6` (also used for question headline, summary title) | `theme.headerInk` |
| Date label / hint text `#7A8FA0`, `#4E5E68` | `theme.headerSub` / `theme.cardSub` (see open question below on which maps where) |
| Avatar circle `background:"#E3A878"` | `theme.avatarBg`, text `theme.avatarInk` |
| Unselected metric dot `rgba(236,230,216,.08)`, mini-card bg `rgba(236,230,216,.06)` | `theme.trackBg` |
| **NOT changed:** `METRICS[].color` (energy/mood/stress/sleep brand colors), error banner colors, "Guardar check-in" button gradient (uses the *selected metric's* semantic color, not a moment color) | stays hardcoded |

**`ProgressBody.tsx`:**
| Current (hardcoded) | Becomes |
|---|---|
| Outer wrapper `background: linear-gradient(...)` (literally the night `skyGradient`) + `<ForestBackground />` | drop the outer gradient (the sky mesh already paints this); `<ThreeBackground moment={theme.key} />` |
| "Dawn curtain" reveal overlay, hardcoded to the night gradient | `theme.skyGradient` (so the reveal-fade matches whatever sky is actually showing) |
| Metric cards / adventure cards background `rgba(14,20,36,.82)` / `.7`, border `rgba(236,230,216,.12)` | `theme.glassBg`, `theme.glassBorder` (see open question on collapsing opacity tiers below) |
| "Mi Progreso" title `#F2EFE6`, month subtitle `#5A6A78` | `theme.headerInk`, `theme.headerSub` |
| Card body text (`#8A9AA6`, `#4E6070`, `#F2EFE6` inside cards) | `theme.cardSub` / `theme.cardInk` |
| Avatar/logout circle `background:"#E3A878"` | `theme.avatarBg` / `theme.avatarInk` |
| **NOT changed:** `ADVENTURE_COLORS`, `METRIC_DEFS[].color`, trend arrow colors, streak flame `#E3A878`/`🔥` styling | stays hardcoded |

**`AdventureDetailBody.tsx`:**
| Current (hardcoded) | Becomes |
|---|---|
| `momentKey: MomentKey` prop | `theme: MomentTheme` prop (`theme.key` used for `<ThreeBackground moment={theme.key} />`) |
| Header panel background `rgba(14,20,36,.82)` (the heavier of the two) | `theme.glassBgStrong` |
| Missions panel background `rgba(14,20,36,.78)` (the lighter of the two) | `theme.glassBg` |
| Both panels' border `rgba(236,230,216,.12/.14)` | `theme.glassBorder` |
| Title `#F2EFE6` | `theme.headerInk` |
| Description/meta text `#7A8FA0`, `#5A6A78`, `#4E6070` | `theme.cardSub` |
| **NOT changed:** completion-percentage badge green (`#7E9A86`), progress-bar gradient, nav rail/bottom nav, "back to dashboard" link color `#7EB8D8` | stays hardcoded |

## Design Decisions (resolved with Jose, 2026-07-05)

1. **Opacity tiers are preserved, not collapsed — new `glassBgStrong` field.** Dashboard uses one `theme.glassBg` value for its two panels, but Check-in/Progress/Adventure-Detail currently use two visual weights: a near-opaque tier (`.82`/`.84`) for primary/foreground cards (metric cards, header/missions panels) and a more translucent tier (`.7`) for secondary cards (week-strip). Jose wants this depth cue kept — collapsing to a single opacity was rejected. Resolution: add a second field to `MomentTheme`, `glassBgStrong`, alongside the existing `glassBg`. Same RGB base per moment as `glassBg` (so it's still 100% moment-tinted, not a new hardcoded color), just a higher, fixed alpha matching each moment's current "heavy" card look:

   | Moment | `glassBg` (existing, light tier) | `glassBgStrong` (new, heavy tier) |
   |---|---|---|
   | manana | `rgba(251,248,241,.56)` | `rgba(251,248,241,.82)` |
   | tarde | `rgba(251,250,246,.5)` | `rgba(251,250,246,.80)` |
   | atardecer | `rgba(251,243,233,.46)` | `rgba(251,243,233,.78)` |
   | noche | `rgba(26,36,42,.5)` | `rgba(26,36,42,.84)` |

   Usage: primary/foreground cards (metric cards, header/missions panels) → `theme.glassBgStrong`; secondary/lighter cards (week-strip, nested sub-cards) → `theme.glassBg` (existing field, unchanged). `glassBorder`/`glassShadow`/`glassInner` stay single-tier as today (no evidence they need a second tier too). This is a pure *addition* to `MomentTheme` — `DashboardBody.tsx` and every other existing consumer of `glassBg` is unaffected.
2. **`headerInk`/`headerSub` vs. `cardInk`/`cardSub` boundary in Check-in/Progress.** Dashboard only has one big greeting-style headline per page, so the line is clean there. Check-in has several headline-sized moments (the "Hola, {nombre}" intro, each metric's big question, the summary title) — this spec maps all of them to `headerInk`, and all smaller/secondary text to `cardSub`/`cardInk`, but the implementer should sanity-check this visually rather than follow the table blindly.
3. **`avatarBg`/`avatarInk` migration changes today's look — accepted.** Right now Check-in/Progress/Adventure-Detail's avatar circle is a fixed warm orange (`#E3A878`) in all four moments. Migrating it to `theme.avatarBg` (matching Dashboard) means it will only be orange during `noche`; it'll be dark (`#2A332D`/`#1E2A2C`/`#3A2A30`) in the other three moments. Jose confirmed this is fine — the avatar/logout button isn't a brand element and may be replaced with a settings/logout icon in the future anyway.

## Testing / Verification

No automated test framework for this repo's frontend visual output (consistent with existing convention — CI only runs `tsc`/lint). Verification is manual:

- `tsc --noEmit` and `eslint` clean after each task (automated, per-task).
- Visual check across all 4 moments. Since `getMoment()` reads the real clock, checking all 4 in one sitting means either waiting for actual different hours, or temporarily overriding the computed hour during local testing. Suggested lightweight approach (implementer to confirm feasibility in the plan): support an optional `?hour=` query param read only in development (`process.env.NODE_ENV === "development"`) that overrides the computed `localHour` in `getRequestMoment()`, so Jose can visit `/checkin?hour=8`, `/checkin?hour=13`, `/checkin?hour=19`, `/checkin?hour=23` locally without waiting for the actual time to change. This must never affect production behavior.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Visual regressions only visible by eye, no automated screenshot diffing exists | Manual check across all 4 moments per page, via the dev-only `?hour=` override above |
| The new `glassBgStrong` alpha values (Design Decision 1) are a best-effort match to today's hardcoded heavy-tier opacity, not a pixel-exact port | Explicitly a judgment call; easy to nudge the alpha per moment later if a specific card looks off during visual verification |
| `getRequestMoment()` refactor of `app/page.tsx` / `app/adventures/[id]/page.tsx` is a behavior-preserving refactor, but any subtle diff (e.g. timezone fallback order) would silently change Dashboard's already-correct behavior | Task 1 is scoped as pure extraction with no logic change; verify Dashboard's sky still looks identical to before once wired through the helper |

## Future Work (explicitly deferred)

- A dev-only visual harness that renders all 4 moments side-by-side (would remove the need for the `?hour=` override entirely).
