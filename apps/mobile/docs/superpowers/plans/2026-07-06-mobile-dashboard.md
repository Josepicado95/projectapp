# Mobile Dashboard (Round A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Home tab with a real Dashboard (adventures, streak, recommendations) and add an Adventure Detail screen with mission-toggle, both wired against the existing `/api/mobile/*` backend — no create/edit/delete, no check-in submission, no animated sky background yet (all deferred to later rounds).

**Architecture:** A small independent `mobile-theme.ts` supplies flat gradient/text colors per moment of day (no 3D engine). A `useDashboardData()` custom hook fetches the Dashboard's data (adventures, check-ins, recommendations) in parallel. The Dashboard screen shows adventure cards only (no missions); tapping one navigates to a separate Adventure Detail screen, which owns the mission list and the toggle-complete interaction.

**Tech Stack:** Expo Router, TypeScript, NativeWind, `expo-linear-gradient` (new dependency).

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-dashboard-design.md`

## Global Constraints

- Run all commands in this plan from `apps/mobile/` unless a step says otherwise.
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as the rest of `apps/mobile`.
- No automated test framework — verification is `npx tsc --noEmit` per task, plus a final manual pass on a physical phone via Expo Go (per the spec's Testing section).
- Import other `apps/mobile/src/*` modules via the `@/` alias (e.g. `@/lib/api`), matching the existing convention.
- The Dashboard screen shows adventure **cards only** — no missions, no toggle. All mission display and the toggle-complete interaction live exclusively in the Adventure Detail screen (spec's explicit screen-boundary decision — do not blur this line).
- No changes to `apps/web` or any `/api/mobile/*` route handler — this plan is a pure consumer of the already-shipped API.
- No animated background, no `sky-engine.ts`/Three.js/`expo-gl` code — flat gradients only via `mobile-theme.ts` (Round A.5 is a separate future plan).

---

### Task 1: Shared types and mobile theme colors

**Files:**
- Create: `apps/mobile/src/lib/types.ts`
- Create: `apps/mobile/src/lib/mobile-theme.ts`

**Interfaces:**
- Produces: `AdventureSummary`, `MissionData`, `AdventureDetail`, `CheckInData`, `Recommendation` (types); `MomentKey`, `MobileTheme` (types), `getMobileMoment(hour: number): MobileTheme` (function).
- Consumed by: Task 2 (`use-dashboard-data.ts`), Task 3 (Adventure Detail screen), Task 4 (Dashboard screen).

- [ ] **Step 1: Install `expo-linear-gradient`**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 2: Write the shared types**

Create `apps/mobile/src/lib/types.ts`:

```ts
export type AdventureSummary = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  paletteIdx: number;
};

export type MissionData = {
  id: number;
  adventureId: number;
  title: string;
  description: string | null;
  difficulty: number;
  completed: boolean;
};

export type AdventureDetail = AdventureSummary & {
  missions: MissionData[];
};

export type CheckInData = {
  id: number;
  date: string;
  energy: number;
  mood: number;
  stress: number;
  sleep: number;
};

export type Recommendation = {
  id: number;
  title: string;
  difficulty: number;
  reason: string;
};
```

- [ ] **Step 3: Write the mobile theme**

Create `apps/mobile/src/lib/mobile-theme.ts`. These colors are taken directly from the web's `sky-engine.ts` `MOMENTS.sky` arrays (first/last stop of each moment's gradient) and `theme.ts`'s `headerInk`/`headerSub`/`glassBg` fields, so the palette matches the web app's design system exactly — just without the animated engine:

```ts
export type MomentKey = "manana" | "tarde" | "atardecer" | "noche";

export type MobileTheme = {
  key: MomentKey;
  gradientFrom: string;
  gradientTo: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
};

const MOMENTS: Record<MomentKey, MobileTheme> = {
  manana: {
    key: "manana",
    gradientFrom: "#A6C2CC",
    gradientTo: "#EFF2EA",
    textPrimary: "#2A332D",
    textSecondary: "#4C5A4E",
    cardBg: "rgba(251,248,241,.56)",
  },
  tarde: {
    key: "tarde",
    gradientFrom: "#57A6CE",
    gradientTo: "#EBF6F1",
    textPrimary: "#14242A",
    textSecondary: "#2E4750",
    cardBg: "rgba(251,250,246,.5)",
  },
  atardecer: {
    key: "atardecer",
    gradientFrom: "#3A3A70",
    gradientTo: "#F9D888",
    textPrimary: "#FBF2E6",
    textSecondary: "rgba(251,242,230,.86)",
    cardBg: "rgba(251,243,233,.46)",
  },
  noche: {
    key: "noche",
    gradientFrom: "#070E28",
    gradientTo: "#2C4884",
    textPrimary: "#ECE6D8",
    textSecondary: "#A7B2AE",
    cardBg: "rgba(26,36,42,.5)",
  },
};

export function getMobileMoment(hour: number): MobileTheme {
  if (hour >= 6 && hour < 11) return MOMENTS.manana;
  if (hour >= 11 && hour < 17) return MOMENTS.tarde;
  if (hour >= 17 && hour < 20) return MOMENTS.atardecer;
  return MOMENTS.noche;
}
```

(The hour boundaries are copied verbatim from `apps/web/lib/theme.ts`'s `getMoment()`, so mobile and web agree on which hours map to which moment.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/mobile-theme.ts package.json package-lock.json
git commit -m "feat(mobile): add shared types and flat per-moment theme colors"
```

---

### Task 2: Dashboard data-fetching hook

**Files:**
- Create: `apps/mobile/src/lib/use-dashboard-data.ts`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `AdventureSummary`, `CheckInData`, `Recommendation` (`@/lib/types`, Task 1).
- Produces: `useDashboardData(): { adventures: AdventureSummary[]; checkIns: CheckInData[]; recommendations: Recommendation[]; recommendationsMessage: string | null; isLoading: boolean; error: string | null; refetch: () => void }`.
- Consumed by: Task 4 (Dashboard screen).

- [ ] **Step 1: Write the hook**

Create `apps/mobile/src/lib/use-dashboard-data.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "./api";
import type { AdventureSummary, CheckInData, Recommendation } from "./types";

type RecommendationsResponse = { recommendations: Recommendation[]; message: string };

type DashboardState = {
  adventures: AdventureSummary[];
  checkIns: CheckInData[];
  recommendations: Recommendation[];
  recommendationsMessage: string | null;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: DashboardState = {
  adventures: [],
  checkIns: [],
  recommendations: [],
  recommendationsMessage: null,
  isLoading: true,
  error: null,
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [adventures, checkIns, recs] = await Promise.all([
        apiRequest<AdventureSummary[]>("/api/mobile/adventures"),
        apiRequest<CheckInData[]>("/api/mobile/checkins?days=14"),
        apiRequest<RecommendationsResponse>("/api/mobile/recommendations"),
      ]);
      setState({
        adventures,
        checkIns,
        recommendations: recs.recommendations,
        recommendationsMessage: recs.recommendations.length === 0 ? recs.message : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar el dashboard.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/use-dashboard-data.ts
git commit -m "feat(mobile): add useDashboardData hook"
```

---

### Task 3: Adventure Detail screen

**Files:**
- Create: `apps/mobile/src/app/adventures/[id].tsx`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError` (`@/lib/api`); `AdventureDetail`, `MissionData` (`@/lib/types`, Task 1); `getMobileMoment` (`@/lib/mobile-theme`, Task 1); `useLocalSearchParams`, `useRouter` (`expo-router`).
- Produces: the route `/adventures/[id]`, consumed by Task 4's `router.push`.

This task is self-contained (own local fetch + toggle state) and does not depend on Task 2's hook — deliberately, per the spec's Risk about not growing `useDashboardData()` into a "God hook."

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/adventures/[id].tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureDetail, MissionData } from "@/lib/types";

export default function AdventureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [adventure, setAdventure] = useState<AdventureDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AdventureDetail>(`/api/mobile/adventures/${id}`);
      setAdventure(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la aventura.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleMission(mission: MissionData) {
    if (!adventure) return;
    const nextCompleted = !mission.completed;

    setAdventure({
      ...adventure,
      missions: adventure.missions.map((m) =>
        m.id === mission.id ? { ...m, completed: nextCompleted } : m
      ),
    });

    try {
      await apiRequest(`/api/mobile/missions/${mission.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch {
      // Revert only this specific mission, by id — never a shared
      // "last toggled" variable, so rapid taps on different missions
      // can't revert the wrong one.
      setAdventure((current) =>
        current
          ? {
              ...current,
              missions: current.missions.map((m) =>
                m.id === mission.id ? { ...m, completed: mission.completed } : m
              ),
            }
          : current
      );
    }
  }

  const theme = getMobileMoment(new Date().getHours());

  if (isLoading) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.textPrimary} />
      </LinearGradient>
    );
  }

  if (error || !adventure) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 16, textAlign: "center" }}>
          {error ?? "Aventura no encontrada."}
        </Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Volver</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const total = adventure.missions.length;
  const done = adventure.missions.filter((m) => m.completed).length;

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4 }}>
          {adventure.title}
        </Text>
        {adventure.description ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 16 }}>
            {adventure.description}
          </Text>
        ) : null}
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 24 }}>
          {done} de {total} misiones completadas
        </Text>

        {adventure.missions.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => toggleMission(m)}
            style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>{m.completed ? "✓" : "○"}</Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontWeight: "500",
                flex: 1,
                textDecorationLine: m.completed ? "line-through" : "none",
              }}
            >
              {m.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output (this screen references no route other than its own, so no typed-routes gap is possible here).

- [ ] **Step 3: Commit**

```bash
git add src/app/adventures/\[id\].tsx
git commit -m "feat(mobile): add Adventure Detail screen with mission toggle"
```

---

### Task 4: Dashboard screen

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useDashboardData` (`@/lib/use-dashboard-data`, Task 2); `getMobileMoment` (`@/lib/mobile-theme`, Task 1); `CheckInData` (`@/lib/types`, Task 1); `useAuth` (`@/lib/auth-context`, existing); `useRouter` (`expo-router`); the `/adventures/[id]` route (Task 3).

- [ ] **Step 1: Replace the screen**

Replace the full contents of `apps/mobile/src/app/(tabs)/index.tsx`:

```tsx
import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { CheckInData } from "@/lib/types";

function computeStreak(checkIns: CheckInData[]): number {
  const days = new Set(checkIns.map((c) => c.date.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
    } else if (i === 0) {
      continue; // today may not have a check-in yet — don't break the streak on day 0
    } else {
      break;
    }
  }
  return streak;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { adventures, checkIns, recommendations, recommendationsMessage, isLoading, error, refetch } =
    useDashboardData();

  const theme = useMemo(() => getMobileMoment(new Date().getHours()), []);
  const streak = useMemo(() => computeStreak(checkIns), [checkIns]);

  if (isLoading) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.textPrimary} />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 16, textAlign: "center" }}>
          No se pudo cargar. Revisa tu conexión.
        </Text>
        <Pressable onPress={refetch} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Reintentar</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4 }}>
          Hola, {user?.name}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24 }}>
          Racha actual: {streak} {streak === 1 ? "día" : "días"}
        </Text>

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>
        {adventures.length === 0 ? (
          <Text style={{ color: theme.textSecondary, marginBottom: 24 }}>
            Todavía no tienes aventuras.
          </Text>
        ) : (
          adventures.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/adventures/${a.id}`)}
              style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12 }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>{a.title}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{a.status}</Text>
            </Pressable>
          ))
        )}

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 16 }}>
          Recomendado para hoy
        </Text>
        {recommendations.length === 0 ? (
          <Text style={{ color: theme.textSecondary }}>{recommendationsMessage}</Text>
        ) : (
          recommendations.map((r) => (
            <View key={r.id} style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>{r.title}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>{r.reason}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

Expected: likely **clean**, since Task 3 already created `src/app/adventures/[id].tsx` before this task runs, so Expo Router's typed-routes should already know about `/adventures/[id]`. If you *do* see an error like `Argument of type '`/adventures/${string}`' is not assignable to parameter of type '...'`, that means the route-types file (`.expo/types/router.d.ts`) hasn't regenerated since Task 3's file was created — this is the same expected, transient typed-routes state documented in the earlier mobile-scaffold plan (Task 6), and it resolves the next time `npx expo start` runs (Task 5, next). Do not try to work around it with type casts — just note it and proceed to Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(tabs\)/index.tsx
git commit -m "feat(mobile): replace placeholder Home tab with real Dashboard"
```

---

### Task 5: Full end-to-end verification on a physical phone

**Files:** none (verification only).

- [ ] **Step 1: Start both servers**

Terminal 1, from `apps/web`:
```bash
npm run dev
```

Terminal 2, from `apps/mobile`:
```bash
npx expo start
```

Scan the QR code with Expo Go (same phone/PC LAN setup as the earlier scaffold sub-project — `apps/mobile/.env`'s `EXPO_PUBLIC_API_URL` must point at your PC's LAN IP, not `localhost`).

- [ ] **Step 2: Walk through the verification checklist**

1. Log in with `jose@aventuras.com` / `aventuras123` → lands on the Dashboard (real Home tab, not the old placeholder).
2. Dashboard shows your real adventures as cards, a streak number, and either real recommendations or the backend's fallback message.
3. The background gradient and text colors match the current real hour (compare against `apps/mobile/src/lib/mobile-theme.ts`'s `getMobileMoment()` boundaries — e.g. if it's currently between 06:00–11:00, the `manana` colors should show).
4. Tap an adventure card → navigates to Adventure Detail, showing its real missions and description.
5. Tap a mission → toggles its checkmark and strikethrough immediately (optimistic update); force-quit the app and reopen, navigate back to that adventure → the toggle persisted (confirms the `PATCH` actually saved, not just the local optimistic state).
6. Tap "Volver" → returns to the Dashboard.
7. Stop the `apps/web` dev server (Ctrl+C in Terminal 1), pull-to-refresh or force a reload on the Dashboard → shows the "No se pudo cargar" retry state, not a crash. Restart `apps/web`'s dev server, tap "Reintentar" → recovers and shows data again.

- [ ] **Step 3: Report results**

If every step matches, Round A is complete. If a specific mission's toggle fails to revert correctly under a real network failure, or the streak count looks wrong for your actual check-in history, note the specific discrepancy — don't guess at a fix without seeing the actual behavior.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — shared types + theme (Task 1), data-fetching hook (Task 2), Adventure Detail (Task 3), Dashboard (Task 4), manual verification (Task 5). The spec's explicit screen-boundary decision (missions/toggle only in Adventure Detail) is enforced in both Task 3 and Task 4's code and called out in Global Constraints.
- **Scope check:** no CRUD, no check-in submission form, no Progress screen, no animated background anywhere in this plan — matching the spec's Non-Goals exactly.
- **Ordering:** Task 3 (Adventure Detail) is deliberately placed *before* Task 4 (Dashboard) even though the Dashboard is the "entry point," specifically so the `/adventures/[id]` route already exists by the time Task 4 references it with `router.push` — avoiding an avoidable transient typed-routes gap.
- **Type consistency:** `AdventureDetail` (Task 1) is used identically in Task 3; `CheckInData` (Task 1) matches `computeStreak`'s usage in Task 4; `useDashboardData()`'s returned shape (Task 2) matches exactly what Task 4 destructures. `toggleMission`'s revert-by-id logic (Task 3) matches the spec's Risk mitigation verbatim.
