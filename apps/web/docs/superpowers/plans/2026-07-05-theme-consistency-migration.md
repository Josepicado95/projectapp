# Theme Consistency Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Process note (not encoded in subagent-driven-development itself):** this project's `CLAUDE.md` requires every task in this plan to go through a Modo B review cycle with Jose after its automated task review passes — line-by-line explanation of the diff, an active-review exercise (1-2 points for Jose to spot before they're revealed), and a checkpoint question — before moving to the next task. Do not chain tasks back-to-back without that pause.

**Goal:** fix the reported bug (Check-in/Progress always show a night sky) by bringing all three non-Dashboard pages (Check-in, Progress, Adventure Detail) up to `DashboardBody.tsx`'s existing level of time-of-day awareness — sky **and** glass-panel chrome — using the same `theme.*` pattern Dashboard already uses, and removing the now-dead `ForestBackground.tsx`.

**Spec:** `apps/web/docs/superpowers/specs/2026-07-05-theme-consistency-migration-design.md`

## Global Constraints

- **Semantic/category colors stay hardcoded — do not touch them.** This includes (non-exhaustive, verify against the spec's per-component tables): the four check-in metric colors (energy `#E3A878`, mood `#7EB8D8`, stress `#C48FB4`, sleep `#7E9A86`), `ADVENTURE_COLORS`, `METRIC_DEFS[].color`, mission difficulty tier colors and XP/level colors (`LEVELS` in Dashboard — untouched anyway, Dashboard is out of scope), the streak flame accent, error red / success green indicator colors, and nav-link accent colors (`#7EB8D8`/`#CDE6F5`/`#9FB4C6`).
- **Nav rail and bottom nav backgrounds stay hardcoded** (`rgba(10,15,26,.66)` / `rgba(10,15,26,.88)`) — confirmed fixed across all four components today, including Dashboard. Do not make these `theme.*`.
- **`DashboardBody.tsx` and `apps/web/app/page.tsx` are out of scope.** Do not modify them except where Task 1 extracts shared logic they already contain (extraction only, no behavior change).
- **`apps/mobile` is out of scope.** This is a web-only fix.
- Run all commands from `apps/web/`.
- `tsc --noEmit` and `eslint .` (or the project's existing lint script) must be clean after every task.
- No automated visual test framework exists — visual verification is manual, via the dev-only `?hour=` override built in Task 1.

---

### Task 1: Add `glassBgStrong` to `MomentTheme`; extract `getRequestMoment()` helper; refactor `app/page.tsx` and `app/adventures/[id]/page.tsx` to use it

**Files:**
- Modify: `apps/web/lib/theme.ts` (add `glassBgStrong` field to the `MomentTheme` interface and all 4 `MOMENTS` entries)
- Create: `apps/web/lib/get-request-moment.ts`
- Modify: `apps/web/app/page.tsx` (replace inline timezone/hour logic with a call to the helper — no other change)
- Modify: `apps/web/app/adventures/[id]/page.tsx` (same)

**Interfaces:**
- Produces: `MomentTheme.glassBgStrong: string` (new field, alongside the existing `glassBg`); `getRequestMoment(overrideHour?: number): Promise<MomentTheme>` — server-only (uses `next/headers`).
- Consumed by: Task 1's own refactor, and Tasks 2–4 for `checkin/page.tsx`, `progress/page.tsx`, `adventures/[id]/page.tsx`, and their body components' chrome.

- [ ] **Step 0: Add `glassBgStrong` to the theme**

Per the spec's Design Decision 1: a second, more-opaque glass-panel tier for primary/foreground cards, alongside the existing `glassBg` (kept as the lighter/secondary tier — unchanged, so `DashboardBody.tsx` and every other existing consumer is unaffected). Same RGB base as each moment's `glassBg`, just a higher fixed alpha:

In `apps/web/lib/theme.ts`, add `glassBgStrong: string;` to the `MomentTheme` interface (right next to `glassBg`), and add this value to each of the 4 entries in `MOMENTS`:

| Moment | Add `glassBgStrong:` |
|---|---|
| `manana` | `"rgba(251,248,241,.82)"` |
| `tarde` | `"rgba(251,250,246,.80)"` |
| `atardecer` | `"rgba(251,243,233,.78)"` |
| `noche` | `"rgba(26,36,42,.84)"` |

Run `tsc --noEmit` — expect **errors** pointing at every place that builds a `MomentTheme` object without the new required field... but since all 4 entries in `MOMENTS` are being updated in this same step, there should be no such errors if all 4 are done together. If TypeScript does flag a missing-field error somewhere else, that means another `MomentTheme` literal exists outside `theme.ts` — find it and add the field there too before moving on.

- [ ] **Step 1: Write the helper**

Create `apps/web/lib/get-request-moment.ts`:

```ts
import { headers } from "next/headers";
import { getMoment, type MomentTheme } from "./theme";

export async function getRequestMoment(overrideHour?: number): Promise<MomentTheme> {
  if (
    process.env.NODE_ENV === "development" &&
    overrideHour !== undefined &&
    !Number.isNaN(overrideHour) &&
    overrideHour >= 0 &&
    overrideHour <= 23
  ) {
    return getMoment(overrideHour);
  }

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  return getMoment(localHour);
}
```

The `overrideHour` param exists purely so Jose can visually check all 4 moments locally (e.g. `/checkin?hour=8`) without waiting for the actual clock to change — it's a no-op outside `NODE_ENV === "development"`, so it cannot affect production.

- [ ] **Step 2: Refactor `app/page.tsx`**

Replace:
```ts
const reqHeaders = await headers();
const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const localHour = parseInt(
  new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
  10
);
const theme = getMoment(localHour);
```
with:
```ts
const theme = await getRequestMoment();
```
Remove the now-unused `headers` and `getMoment` imports if nothing else in the file needs them (`redirect`, `auth`, `DashboardBody` imports stay).

- [ ] **Step 3: Refactor `app/adventures/[id]/page.tsx`**

Same replacement. This file doesn't yet accept a `?hour=` query param — leave it without one for now (Task 4 wires it up once `AdventureDetailBody` actually needs to be checked across moments).

- [ ] **Step 4: Verify no behavior change**

Run `tsc --noEmit` and `eslint .` — clean. Then in the browser, confirm the Dashboard's sky still matches your current local time exactly as it did before this refactor (this task must not change Dashboard's behavior, only where the logic lives).

- [ ] **Step 5: Commit**

```bash
git add lib/theme.ts lib/get-request-moment.ts app/page.tsx app/adventures/\[id\]/page.tsx
git commit -m "feat(theme): add glassBgStrong tier, extract getRequestMoment() helper"
```

---

### Task 2: Migrate Check-in to the theme system

**Files:**
- Modify: `apps/web/app/checkin/page.tsx` (compute + pass `theme`)
- Modify: `apps/web/components/CheckInBody.tsx` (accept `theme: MomentTheme`, use it for chrome, drop `ForestBackground`)

**Interfaces:**
- Consumes: `getRequestMoment()` (Task 1), `MomentTheme` (`apps/web/lib/theme.ts`), `ThreeBackground` (`apps/web/components/background/ThreeBackground.tsx`).

- [ ] **Step 1: Wire the page**

In `checkin/page.tsx`, add:
```ts
import { getRequestMoment } from "@/lib/get-request-moment";
```
Accept an optional `searchParams` prop (Next.js Server Component convention) so the dev-only `?hour=` override reaches the helper:
```tsx
export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ hour?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { hour } = await searchParams;
  const theme = await getRequestMoment(hour !== undefined ? parseInt(hour, 10) : undefined);

  const userName = session.user.name ?? session.user.email ?? "tú";

  return <CheckInBody userName={userName} theme={theme} />;
}
```

- [ ] **Step 2: Update `CheckInBody`'s props and imports**

```ts
import ThreeBackground from "@/components/background/ThreeBackground";
import type { MomentTheme } from "@/lib/theme";

type Props = { userName: string; theme: MomentTheme };

export default function CheckInBody({ userName, theme }: Props) {
```
Remove the `ForestBackground` import.

- [ ] **Step 3: Replace the background**

Both `<ForestBackground static />` call sites (loading/error state and the main return) become `<ThreeBackground moment={theme.key} isStatic />`.

- [ ] **Step 4: Migrate chrome colors per the spec's mapping table**

Apply the "CheckInBody.tsx" table from the design spec: `cardStyle`/`loadingCardStyle` background (the main step-by-step card, currently `.84`) → `theme.glassBgStrong` (the heavy tier — this is a primary/foreground card), border → `theme.glassBorder`; headline text ("Hola, {nombre}", each metric's question, the summary title) → `theme.headerInk`; secondary/hint text → `theme.cardSub` (use judgment per the spec's Design Decision 2 — sanity-check visually, don't apply the table blindly); avatar circle → `theme.avatarBg`/`theme.avatarInk`; unselected dot / mini-card backgrounds → `theme.trackBg` (these are track/chip backgrounds, not glass cards, so they don't use either glass tier).

Do **not** touch `METRICS[].color`, the error banner colors, or any button gradient keyed off a metric's own color (per Global Constraints).

- [ ] **Step 5: Verify**

`tsc --noEmit` and `eslint .` clean. Visually check `/checkin?hour=8`, `/checkin?hour=13`, `/checkin?hour=19`, `/checkin?hour=23` (roughly one per moment — see `getMoment()`'s hour ranges in `lib/theme.ts` if picking your own) and confirm the sky and the card chrome both shift together, while metric colors/icons stay the same across all four.

- [ ] **Step 6: Commit**

```bash
git add app/checkin/page.tsx components/CheckInBody.tsx
git commit -m "feat(theme): make Check-in time-of-day aware (sky + chrome)"
```

---

### Task 3: Migrate Progress to the theme system; delete `ForestBackground.tsx`

**Files:**
- Modify: `apps/web/app/progress/page.tsx` (compute + pass `theme`)
- Modify: `apps/web/components/ProgressBody.tsx` (accept `theme: MomentTheme`, use it for chrome, drop `ForestBackground`)
- Delete: `apps/web/components/ForestBackground.tsx`

**Interfaces:**
- Same as Task 2, for the Progress page.

- [ ] **Step 1: Wire the page**

Same pattern as Task 2 Step 1, applied to `progress/page.tsx` (accept `searchParams`, call `getRequestMoment`, pass `theme` into `ProgressBody`).

- [ ] **Step 2: Update `ProgressBody`'s props and imports**

```ts
import ThreeBackground from "@/components/background/ThreeBackground";
import type { MomentTheme } from "@/lib/theme";

type Props = {
  adventures: Adventure[];
  checkIns: CheckIn[];
  userName: string;
  streak: number;
  logoutAction?: () => Promise<void>;
  theme: MomentTheme;
};
```
Remove the `ForestBackground` import.

- [ ] **Step 3: Replace the background and drop the hardcoded outer gradient**

Remove the outer wrapper's hardcoded `background: "linear-gradient(180deg,#0E1630 ...)"` (the sky mesh already paints the background — this was redundant even before this migration, just invisible behind the night-only `ForestBackground`). Replace `<ForestBackground />` with `<ThreeBackground moment={theme.key} />`.

Update the "Dawn curtain" reveal overlay's hardcoded gradient to `theme.skyGradient`, so the reveal-fade matches whichever sky is actually showing instead of always fading from black-navy.

- [ ] **Step 4: Migrate chrome colors per the spec's mapping table**

Per the spec's Design Decision 1, preserve the existing two-tier depth instead of flattening it: metric cards / adventure cards (today's heavier `.82` tier) → `theme.glassBgStrong`; the week-strip card (today's lighter `.7` tier) → `theme.glassBg`. Border → `theme.glassBorder` for both. "Mi Progreso" title → `theme.headerInk`, month subtitle → `theme.headerSub`. Card body text → `theme.cardSub`/`theme.cardInk`. Avatar/logout circle → `theme.avatarBg`/`theme.avatarInk`.

Do **not** touch `ADVENTURE_COLORS`, `METRIC_DEFS[].color`, trend arrow colors, or the streak flame styling.

- [ ] **Step 5: Delete `ForestBackground.tsx` and confirm nothing else imports it**

Run `grep -rn "ForestBackground" apps/web/` (excluding the file itself) — expect zero remaining matches after Task 2 and this task. Delete `apps/web/components/ForestBackground.tsx`.

- [ ] **Step 6: Verify**

`tsc --noEmit` and `eslint .` clean. Visually check `/progress?hour=8`, `?hour=13`, `?hour=19`, `?hour=23` — sky, panels, and the dawn-curtain reveal all shift together; `ADVENTURE_COLORS`/metric colors/streak flame stay fixed.

- [ ] **Step 7: Commit**

```bash
git add app/progress/page.tsx components/ProgressBody.tsx
git rm components/ForestBackground.tsx
git commit -m "feat(theme): make Progress time-of-day aware, remove dead ForestBackground"
```

---

### Task 4: Migrate Adventure Detail to the theme system

**Files:**
- Modify: `apps/web/app/adventures/[id]/page.tsx` (pass full `theme` instead of `momentKey`; accept `?hour=` for local testing)
- Modify: `apps/web/components/AdventureDetailBody.tsx` (accept `theme: MomentTheme` instead of `momentKey: MomentKey`, use it for chrome)

**Interfaces:**
- Consumes: `getRequestMoment()` (Task 1, already wired into this page).

- [ ] **Step 1: Add the `?hour=` override to this page**

Task 1 already refactored this page to call `getRequestMoment()`, but without the query-param plumbing (Task 1 explicitly deferred it here). Add the same `searchParams` handling as Task 2 Step 1, and pass the resolved hour into `getRequestMoment(...)`.

- [ ] **Step 2: Pass the full theme object**

Change:
```tsx
return <AdventureDetailBody adventureId={adventureId} momentKey={theme.key} />;
```
to:
```tsx
return <AdventureDetailBody adventureId={adventureId} theme={theme} />;
```

- [ ] **Step 3: Update `AdventureDetailBody`'s props**

```ts
import type { MomentTheme } from "@/lib/theme";

type Props = { adventureId: number; theme: MomentTheme };

export default function AdventureDetailBody({ adventureId, theme }: Props) {
```
Every existing `<ThreeBackground moment={momentKey} />` call becomes `<ThreeBackground moment={theme.key} />`.

- [ ] **Step 4: Migrate chrome colors per the spec's mapping table**

Per the spec's Design Decision 1: the header panel (today's heavier `.82` background) → `theme.glassBgStrong`; the missions panel (today's lighter `.78` background) → `theme.glassBg`. Borders on both → `theme.glassBorder`. Title → `theme.headerInk`. Description/meta text → `theme.cardSub`.

Do **not** touch the completion-percentage badge green, the progress-bar gradient, nav rail/bottom nav, or the "back to dashboard" link color.

- [ ] **Step 5: Verify**

`tsc --noEmit` and `eslint .` clean. Visually check `/adventures/<id>?hour=8`, `?hour=13`, `?hour=19`, `?hour=23`.

- [ ] **Step 6: Commit**

```bash
git add app/adventures/\[id\]/page.tsx components/AdventureDetailBody.tsx
git commit -m "feat(theme): make Adventure Detail's chrome time-of-day aware (sky was already correct)"
```

---

## Self-Review Notes

- **Spec coverage:** all three non-Dashboard pages are covered (Tasks 2–4); the shared helper and its dev-only override are covered (Task 1); the dead-code cleanup (`ForestBackground.tsx`) is covered (Task 3, once it's provably unused).
- **Scope check:** Dashboard, `sky-engine.ts`/`SkyCanvas.tsx`, and `apps/mobile` are never touched by any task. Semantic/category colors are called out as a negative constraint in every task that migrates chrome.
- **Ordering:** Task 1 must land first (Tasks 2–4 all depend on `getRequestMoment()`). Tasks 2 and 3 are independent of each other but both must complete before Task 3's Step 5 (confirming `ForestBackground.tsx` is dead) is valid — do not reorder Task 3 before Task 2.
