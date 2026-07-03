# Web API Migration — `/checkin` Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the `/checkin` page from Server Actions + direct Prisma reads in the page component to the `/api/mobile/checkins` JSON API, authenticated via the NextAuth session cookie (no new token exposed to the browser).

**Architecture:** Extend `withMobileAuth` to accept a NextAuth session cookie as a fallback when no `Authorization: Bearer` header is present. Extend the check-ins API with `today` and `days` query modes so it can serve exactly what the page currently gets from direct Prisma queries. `CheckInBody.tsx` becomes responsible for fetching its own data (`useEffect` on mount) and submitting via `fetch()` (manual loading/error state, replacing `useActionState`). `app/checkin/page.tsx` shrinks to just the auth redirect check.

**Tech Stack:** Next.js 16 (App Router, Route Handlers, Client Components), TypeScript, existing `lib/mobile-auth.ts` / `lib/services/checkins.ts`.

**Spec:** `apps/web/docs/superpowers/specs/2026-07-02-web-api-migration-design.md`

## Global Constraints

- Zero visual/behavioral change: every message, loading order, and status text the user currently sees on `/checkin` must be identical after migration.
- Run all commands from `apps/web/`.
- No new automated test framework — verification is `tsc`, manual curl, and manual browser checks (same convention as `2026-07-01-mobile-api.md`).
- Error responses keep the existing shape `{ "error": { "code": "...", "message": "..." } }`.

---

### Task 1: Dual-mode auth in `withMobileAuth`

**Files:**
- Modify: `apps/web/lib/mobile-auth.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth` (existing NextAuth helper, returns `Session | null` with `session.user.id: string`).
- Produces: `withMobileAuth` now resolves `userId` from a Bearer JWT **or** a valid NextAuth session cookie — every existing route using it (`adventures`, `missions`, `checkins`, `recommendations`, `auth/me`) gains cookie support with no changes to those files.

- [ ] **Step 1: Add the session-cookie fallback**

Replace the current `withMobileAuth` function in `apps/web/lib/mobile-auth.ts` (the whole file from the `import` block down):

```ts
// lib/mobile-auth.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { auth } from "@/auth";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error("MOBILE_JWT_SECRET no está configurado");
  return secret;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, getSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    if (!payload.sub) return null;
    const userId = Number(payload.sub);
    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: number; accessToken: string; refreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return null;
  }

  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    return null;
  }

  const newRefreshToken = await issueRefreshToken(stored.userId);
  const accessToken = signAccessToken(stored.userId);

  return { userId: stored.userId, accessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt) return;

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
}

export type MobileAuthHandler<C> = (
  req: NextRequest,
  ctx: { userId: number } & C
) => Promise<Response>;

export function withMobileAuth<C = unknown>(handler: MobileAuthHandler<C>) {
  return async (req: NextRequest, routeContext: C): Promise<Response> => {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length);
      const userId = verifyAccessToken(token);

      if (userId === null) {
        return apiError(401, "token_expired", "El access token es inválido o expiró");
      }

      return handler(req, { userId, ...routeContext });
    }

    // No Bearer header — fall back to the web app's own NextAuth session cookie.
    const session = await auth();
    if (session?.user?.id) {
      return handler(req, { userId: Number(session.user.id), ...routeContext });
    }

    return apiError(401, "missing_token", "Falta el header Authorization o la sesión");
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

- [ ] **Step 3: Verify the Bearer path still works (curl)**

Start the dev server if it isn't running: `npm run dev` (in a separate terminal, leave it running).

```bash
curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jose@aventuras.com","password":"aventuras123"}'
```

Expected: JSON with `accessToken`, `refreshToken`, `user`. Copy the `accessToken` value for the next command.

```bash
curl -s http://localhost:3000/api/mobile/adventures \
  -H "Authorization: Bearer <accessToken from above>"
```

Expected: `200` with a JSON array (the Bearer path is unchanged — this confirms Step 1 didn't break it).

- [ ] **Step 4: Verify the new cookie path works (browser)**

In a browser, log into the web app normally at `http://localhost:3000/login` (`jose@aventuras.com` / `aventuras123`). Once on the dashboard, open DevTools → Console and run:

```js
fetch("/api/mobile/adventures").then(r => r.json()).then(console.log)
```

Expected: the same JSON array of adventures, with **no** `Authorization` header sent — the NextAuth session cookie authenticated the request. This confirms the new fallback path.

- [ ] **Step 5: Commit**

```bash
git add lib/mobile-auth.ts
git commit -m "feat(web-api-migration): dual-mode auth (Bearer JWT or NextAuth session cookie)"
```

---

### Task 2: Extend the check-ins API with `today` and `days` query modes

**Files:**
- Modify: `apps/web/lib/services/checkins.ts`
- Modify: `apps/web/app/api/mobile/checkins/route.ts`

**Interfaces:**
- Consumes: nothing new from Task 1.
- Produces: `listRecentCheckIns(userId: number, days: number): Promise<CheckInData[]>` (new service function, ascending-by-date, date-range filtered). `GET /api/mobile/checkins?today=true` → `{ checkIn: CheckInData | null }`. `GET /api/mobile/checkins?days=N` → `CheckInData[]`. Existing `GET /api/mobile/checkins?limit=N` and `POST /api/mobile/checkins` are unchanged. Task 3 consumes all three.

- [ ] **Step 1: Add `listRecentCheckIns` to the service**

In `apps/web/lib/services/checkins.ts`, add this function after `listCheckIns` (keep everything else in the file unchanged):

```ts
export async function listRecentCheckIns(userId: number, days: number): Promise<CheckInData[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.checkIn.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}
```

(This intentionally uses local-time `setDate`, matching the date-range math the `/checkin` page already used before migration — not `setUTCDate` like `todayRangeUTC()`. Preserving this exactly is the point: behavior parity, not a fix.)

- [ ] **Step 2: Wire `today` and `days` into the GET route**

Replace the `GET` handler in `apps/web/app/api/mobile/checkins/route.ts`:

```ts
// app/api/mobile/checkins/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withMobileAuth } from "@/lib/mobile-auth";
import { saveCheckIn, listCheckIns, listRecentCheckIns, getTodayCheckIn } from "@/lib/services/checkins";

const CheckInSchema = z.object({
  energy: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  sleep: z.number().int().min(1).max(5),
});

export const GET = withMobileAuth(async (req: NextRequest, { userId }) => {
  const params = req.nextUrl.searchParams;

  if (params.get("today") === "true") {
    const checkIn = await getTodayCheckIn(userId);
    return apiSuccess({ checkIn });
  }

  const daysParam = params.get("days");
  if (daysParam) {
    const days = Math.min(60, Math.max(1, Number(daysParam) || 7));
    const checkIns = await listRecentCheckIns(userId, days);
    return apiSuccess(checkIns);
  }

  const limitParam = params.get("limit");
  const limit = limitParam ? Math.min(30, Math.max(1, Number(limitParam) || 7)) : 7;
  const checkIns = await listCheckIns(userId, limit);
  return apiSuccess(checkIns);
});

export const POST = withMobileAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json().catch(() => null);
  const result = CheckInSchema.safeParse(body);
  if (!result.success) {
    return apiError(400, "validation_error", "Los valores deben estar entre 1 y 5");
  }

  const { checkIn, created } = await saveCheckIn(userId, result.data);
  return apiSuccess(checkIn, created ? 201 : 200);
});
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Verify both new modes with curl**

Reuse the `accessToken` from Task 1 Step 3 (or get a fresh one the same way).

```bash
curl -s "http://localhost:3000/api/mobile/checkins?today=true" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: `{"checkIn":null}` if you haven't checked in today, or the check-in object if you have.

```bash
curl -s "http://localhost:3000/api/mobile/checkins?days=7" \
  -H "Authorization: Bearer <accessToken>"
```

Expected: `200` with a JSON array (possibly empty), ordered oldest → newest.

- [ ] **Step 5: Commit**

```bash
git add lib/services/checkins.ts app/api/mobile/checkins/route.ts
git commit -m "feat(web-api-migration): add today/days query modes to check-ins API"
```

---

### Task 3: Migrate `/checkin` to fetch-based data loading and submission

**Files:**
- Modify: `apps/web/app/checkin/page.tsx`
- Modify: `apps/web/components/CheckInBody.tsx`

**Interfaces:**
- Consumes: `GET /api/mobile/checkins?today=true`, `GET /api/mobile/checkins?days=7`, `POST /api/mobile/checkins` (all from Task 2).
- Produces: `CheckInBody` now takes only `{ userName: string }` as props (no more `today`/`recentWeek` — it fetches them itself). This is the last task before deleting the old Server Action in Task 4.

- [ ] **Step 1: Slim down `app/checkin/page.tsx`**

Replace the entire file:

```tsx
import { redirect } from "next/navigation";
import { auth }     from "@/auth";
import CheckInBody  from "@/components/CheckInBody";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? session.user.email ?? "tú";

  return <CheckInBody userName={userName} />;
}
```

- [ ] **Step 2: Update `CheckInBody.tsx`'s props, state, and data loading**

In `apps/web/components/CheckInBody.tsx`, make these changes:

Update the top imports — `useActionState` is no longer used (replaced by plain `useState` + `fetch`), and the old Server Action import goes away:

```ts
// Change:
// import { useActionState, useState, useEffect, useRef } from "react";
// import { saveCheckIn } from "@/app/actions/checkins";
// to:
import { useState, useEffect, useRef } from "react";
```

Change the Props type from:

```ts
// type Props = { today?: Values; recentWeek: CheckInPoint[]; userName: string; };
// to:
type Props = { userName: string };
```

Change the component's opening (state setup) from:

```ts
export default function CheckInBody({ today, recentWeek, userName }: Props) {
  const [state, formAction, pending] = useActionState(saveCheckIn, {});

  const [step,      setStep]      = useState<number>(today ? 5 : 0);
  const [direction, setDirection] = useState<"forward"|"back">("forward");
  const [animKey,   setAnimKey]   = useState(0);
  const [values,    setValues]    = useState<Values>(
    today ?? { energy: 3, mood: 3, stress: 3, sleep: 3 }
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) setStep(5);
  }, [state?.message]);
```

to:

```ts
type LoadState = "loading" | "ready" | "error";
type SaveState = { status: "idle" | "saving" | "success" | "error"; message?: string; error?: string };

export default function CheckInBody({ userName }: Props) {
  const [loadState,  setLoadState]  = useState<LoadState>("loading");
  const [saveState,  setSaveState]  = useState<SaveState>({ status: "idle" });

  const [step,       setStep]       = useState<number>(0);
  const [direction,  setDirection]  = useState<"forward"|"back">("forward");
  const [animKey,    setAnimKey]    = useState(0);
  const [recentWeek, setRecentWeek] = useState<CheckInPoint[]>([]);
  const [values,     setValues]     = useState<Values>({ energy: 3, mood: 3, stress: 3, sleep: 3 });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [todayRes, weekRes] = await Promise.all([
          fetch("/api/mobile/checkins?today=true"),
          fetch("/api/mobile/checkins?days=7"),
        ]);
        if (!todayRes.ok || !weekRes.ok) throw new Error("load_failed");

        const todayData: { checkIn: Values | null } = await todayRes.json();
        const weekData: CheckInPoint[] = await weekRes.json();
        if (cancelled) return;

        setRecentWeek(weekData.map((c) => ({
          date: c.date.slice(0, 10),
          energy: c.energy,
          mood: c.mood,
          stress: c.stress,
          sleep: c.sleep,
        })));

        if (todayData.checkIn) {
          setValues(todayData.checkIn);
          setStep(5);
        }
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/mobile/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveState({ status: "error", error: body?.error?.message ?? "No se pudo guardar el check-in." });
        return;
      }
      setSaveState({
        status: "success",
        message: res.status === 201 ? "¡Check-in guardado!" : "¡Check-in actualizado!",
      });
      setStep(5);
    } catch {
      setSaveState({ status: "error", error: "No se pudo guardar el check-in." });
    }
  }
```

Note: `todayRes.json()`'s `checkIn` field comes back as `{ id, date, userId, energy, mood, stress, sleep }` from the API (superset of `Values`) — assigning it to a `Values`-typed variable works structurally in TypeScript (extra fields are ignored), so no separate mapping is needed there.

- [ ] **Step 3: Add the loading/error early-returns**

Immediately before the existing `return (` that starts the main JSX (the one beginning with `<div style={{ position:"relative", width:"100%", height:"100vh"...`), insert:

```tsx
  const loadingCardStyle: React.CSSProperties = {
    background: "rgba(14,20,36,.84)",
    backdropFilter: "blur(28px) saturate(1.3)",
    WebkitBackdropFilter: "blur(28px) saturate(1.3)",
    border: "1px solid rgba(236,230,216,.16)",
    borderRadius: 28,
    boxShadow: "0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(236,230,216,.1)",
  };

  if (loadState === "loading" || loadState === "error") {
    return (
      <div style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", fontFamily: "var(--font-hanken), sans-serif" }}>
        <ForestBackground static />
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
          <div style={{ ...loadingCardStyle, width:"100%", maxWidth:440, padding:"48px 44px", textAlign:"center" }}>
            {loadState === "loading" ? (
              <div style={{ fontSize:15, color:"#7A8FA0" }}>Cargando tu check-in…</div>
            ) : (
              <>
                <div style={{ fontSize:15, color:"#F0A0A0", marginBottom:16 }}>No se pudo cargar tu check-in.</div>
                <button
                  onClick={() => window.location.reload()}
                  style={{ fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:14, color:"#1E282A", background:"#E3A878", border:"none", borderRadius:12, padding:"10px 20px", cursor:"pointer" }}
                >
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Update the form JSX to use `handleSubmit`**

Find this block (inside the STEPS 1–4 section):

```tsx
                ) : (
                  <form ref={formRef} action={formAction} style={{ flex:1 }}>
                    <input type="hidden" name="energy" value={values.energy} />
                    <input type="hidden" name="mood"   value={values.mood}   />
                    <input type="hidden" name="stress" value={values.stress} />
                    <input type="hidden" name="sleep"  value={values.sleep}  />
                    <button type="submit" disabled={pending}
                      style={{ width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background: pending ? "rgba(126,154,134,.5)" : "linear-gradient(135deg,#7E9A86 0%,#5E7A66 100%)", border:"none", borderRadius:14, padding:15, cursor: pending ? "wait" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(126,154,134,.3)" }}>
                      <span>{pending ? "Guardando..." : "Guardar check-in"}</span>
                      {!pending && <span style={{ fontSize:17 }}>✓</span>}
                    </button>
                  </form>
                )}
              </div>

              {state.error && (
                <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, background:"rgba(220,80,80,.12)", border:"1px solid rgba(220,80,80,.28)", borderRadius:11, padding:"10px 13px" }}>
                  <span style={{ fontSize:13, color:"#F0A0A0" }}>{state.error}</span>
                </div>
              )}
```

Replace with:

```tsx
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} style={{ flex:1 }}>
                    <button type="submit" disabled={saveState.status === "saving"}
                      style={{ width:"100%", fontFamily:"var(--font-hanken)", fontWeight:700, fontSize:15, color:"#1E282A", background: saveState.status === "saving" ? "rgba(126,154,134,.5)" : "linear-gradient(135deg,#7E9A86 0%,#5E7A66 100%)", border:"none", borderRadius:14, padding:15, cursor: saveState.status === "saving" ? "wait" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(126,154,134,.3)" }}>
                      <span>{saveState.status === "saving" ? "Guardando..." : "Guardar check-in"}</span>
                      {saveState.status !== "saving" && <span style={{ fontSize:17 }}>✓</span>}
                    </button>
                  </form>
                )}
              </div>

              {saveState.status === "error" && (
                <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, background:"rgba(220,80,80,.12)", border:"1px solid rgba(220,80,80,.28)", borderRadius:11, padding:"10px 13px" }}>
                  <span style={{ fontSize:13, color:"#F0A0A0" }}>{saveState.error}</span>
                </div>
              )}
```

- [ ] **Step 5: Update the summary screen's message**

Find (in the STEP 5 block):

```tsx
                <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:24, color:"#F2EFE6", marginBottom:6 }}>
                  {state.message ?? "Check-in guardado"}
                </div>
```

Replace with:

```tsx
                <div style={{ fontFamily:"var(--font-schibsted)", fontWeight:700, fontSize:24, color:"#F2EFE6", marginBottom:6 }}>
                  {saveState.message ?? "Check-in guardado"}
                </div>
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Manual browser verification**

With `npm run dev` running:
1. Log in, navigate to `/checkin`. Expected: brief "Cargando tu check-in…" then the intro screen (step 0) if you haven't checked in today, or the summary (step 5) if you have.
2. Go through steps 1–4, submit. Expected: "Guardando..." briefly, then the summary screen with "¡Check-in guardado!" (or "¡Check-in actualizado!" if you already had one today).
3. Reload `/checkin`. Expected: it now loads straight into the summary screen (step 5) with your just-saved values.
4. Check `/` (dashboard) still shows today's check-in card correctly — it reads the same underlying data via its own (still Server-Action-based, unmigrated) path, so this confirms Task 2 didn't change stored data shape.

- [ ] **Step 8: Commit**

```bash
git add app/checkin/page.tsx components/CheckInBody.tsx
git commit -m "feat(web-api-migration): migrate /checkin to fetch-based loading and submission"
```

---

### Task 4: Delete the now-unused check-in Server Action

**Files:**
- Delete: `apps/web/app/actions/checkins.ts`

**Interfaces:**
- Consumes: confirmation from Task 3 that nothing imports `saveCheckIn` from `app/actions/checkins` anymore.
- Produces: nothing (terminal cleanup task for this plan).

- [ ] **Step 1: Confirm nothing still imports it**

Run: `grep -rn "app/actions/checkins" --include="*.tsx" --include="*.ts" .`
Expected: no matches (Task 3 already removed the only import, in `CheckInBody.tsx`).

- [ ] **Step 2: Delete the file**

```bash
rm app/actions/checkins.ts
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add -A app/actions/checkins.ts
git commit -m "chore(web-api-migration): remove checkins Server Action, superseded by /api/mobile/checkins"
```

---

## Self-Review Notes

- **Spec coverage:** implements the "`/checkin`" slice of the page-based migration order agreed in `2026-07-02-web-api-migration-design.md` (Architecture A dual-mode auth, Architecture B fetch pattern). Adventures/missions and `/progress` are separate follow-up plans.
- **Behavior parity checked:** today/updated message distinction (via HTTP status code), local-time vs UTC date math preserved exactly as before, loading state is new UI (previously invisible because data was ready at SSR time) — flagged explicitly in Task 3 Step 7, not hidden.
- **Known pre-existing quirk carried forward, not fixed:** `listRecentCheckIns` uses local-time `setDate` while `getTodayCheckIn`/`saveCheckIn` use UTC (`todayRangeUTC()`) — this mismatch already existed in the pre-migration code and is preserved for parity, not introduced by this plan.
