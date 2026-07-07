# Mobile Progress (Round C1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "Mi progreso" screen to `apps/mobile` — per-metric 14-day trend bars, a 7-day strip, streak, and per-adventure completion cards — reachable from the Dashboard, wired against the existing `/api/mobile/*` endpoints, no backend changes.

**Architecture:** A new, self-contained stack screen (`progress.tsx`) fetches its own data (adventures with missions, 14 days of check-ins) and computes everything locally — no shared hook, matching the precedent set by Adventure Detail (Round A) and the check-in screen (Round B). The Dashboard gains one new entry-point button, alongside the existing "Hacer check-in" one.

**Tech Stack:** Expo Router, TypeScript, NativeWind, `expo-linear-gradient` (already installed) — no new dependencies.

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-progress-design.md`

## Global Constraints

- Run all commands in this plan from `apps/mobile/` unless a step says otherwise.
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as the rest of `apps/mobile`.
- No automated test framework — verification is `npx tsc --noEmit` per task, plus a final manual pass on a physical phone via Expo Go.
- Import other `apps/mobile/src/*` modules via the `@/` alias.
- No changes to `apps/web` or any `/api/mobile/*` route handler — this plan is a pure consumer of already-shipped endpoints.
- No new files under `src/lib/` and no new npm dependencies (specifically: no `react-native-svg` — flat bars only, per the spec's Non-Goals).
- Task ordering is deliberate: the Progress screen (Task 1) is built *before* the Dashboard references it (Task 2), so `router.push("/progress")` never points at a route that doesn't exist yet — same transient-typed-routes avoidance used in every prior round.

---

### Task 1: Progress screen

**Files:**
- Create: `apps/mobile/src/app/progress.tsx`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `AdventureDetail`, `CheckInData` (`@/lib/types`, existing, from Round A); `getMobileMoment` (`@/lib/mobile-theme`, existing); `useRouter` (`expo-router`).
- Produces: the route `/progress`, consumed by Task 2's `router.push`.

This task is self-contained (own local fetch, no shared hook) and duplicates two small pure functions (`toDailyLatest`, `computeStreak`) that already exist elsewhere in this codebase rather than extracting a shared module — this is the same trade-off already made twice before (see the spec's Risks section).

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/progress.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureDetail, CheckInData } from "@/lib/types";

type MetricKey = "energy" | "mood" | "stress" | "sleep";

type MetricDef = {
  key: MetricKey;
  icon: string;
  label: string;
  color: string;
  inverted: boolean;
};

const METRIC_DEFS: MetricDef[] = [
  { key: "energy", icon: "⚡", label: "Energía", color: "#E3A878", inverted: false },
  { key: "mood", icon: "🌤", label: "Ánimo", color: "#7EB8D8", inverted: false },
  { key: "stress", icon: "🌀", label: "Estrés", color: "#C48FB4", inverted: true },
  { key: "sleep", icon: "🌙", label: "Sueño", color: "#7E9A86", inverted: false },
];

type LoadState = "loading" | "ready" | "error";

function toDailyLatest(checkIns: CheckInData[]): CheckInData[] {
  const byDay = new Map<string, CheckInData>();
  for (const c of checkIns) {
    byDay.set(c.date.slice(0, 10), c);
  }
  return Array.from(byDay.values());
}

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

function trendArrow(series: number[], inverted: boolean): string {
  const n = Math.min(5, Math.floor(series.length / 2));
  if (n === 0) return "→";
  const recent = series.slice(-n).reduce((a, b) => a + b, 0) / n;
  const old = series.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const diff = inverted ? old - recent : recent - old;
  if (diff > 0.25) return "↑";
  if (diff < -0.25) return "↓";
  return "→";
}

export default function ProgressScreen() {
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventures, setAdventures] = useState<AdventureDetail[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [adventuresRes, checkInsRes] = await Promise.all([
        apiRequest<AdventureDetail[]>("/api/mobile/adventures?include=missions"),
        apiRequest<CheckInData[]>("/api/mobile/checkins?days=14"),
      ]);
      setAdventures(adventuresRes);
      setCheckIns(checkInsRes);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loadState === "loading") {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.textPrimary} />
      </LinearGradient>
    );
  }

  if (loadState === "error") {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 16, textAlign: "center" }}>
          No se pudo cargar tu progreso.
        </Text>
        <Pressable onPress={load} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Reintentar</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const dailyCheckIns = toDailyLatest(checkIns);
  const streak = computeStreak(checkIns);

  const metrics = METRIC_DEFS.map((m) => {
    const series = dailyCheckIns.map((c) => c[m.key]);
    const avg = series.length > 0 ? +(series.reduce((a, b) => a + b, 0) / series.length).toFixed(1) : 0;
    const arrow = trendArrow(series, m.inverted);
    const bars = dailyCheckIns.map((c) => ({
      key: c.id,
      barH: Math.max(4, Math.round((c[m.key] / 5) * 24)),
    }));
    return { ...m, avg, arrow, bars };
  });

  const weekBars = dailyCheckIns.slice(-7).map((c) => {
    const avg = (c.energy + c.mood + c.sleep) / 3;
    const barH = Math.max(6, Math.round((avg / 5) * 28));
    const color = avg >= 4 ? "#7E9A86" : avg >= 3 ? "#7EB8D8" : avg >= 2 ? "#E3A878" : "#C48FB4";
    return { key: c.id, barH, color };
  });

  const adventureCards = adventures.slice(0, 5).map((a) => {
    const total = a.missions.length;
    const completed = a.missions.filter((m) => m.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { ...a, total, completed, pct };
  });

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4 }}>
          Mi progreso
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24 }}>
          Racha actual: {streak} {streak === 1 ? "día" : "días"}
        </Text>

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Bienestar · 14 días
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {metrics.map((m) => (
            <View key={m.key} style={{ width: "47%", backgroundColor: theme.cardBg, borderRadius: 16, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 16 }}>{m.icon}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>{m.label}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end", height: 24, marginBottom: 8 }}>
                {m.bars.map((b) => (
                  <View key={b.key} style={{ flex: 1, height: b.barH, borderRadius: 2, backgroundColor: m.color }} />
                ))}
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "700" }}>{m.avg}</Text>
                <Text style={{ color: m.color, fontSize: 14, fontWeight: "700" }}>{m.arrow}</Text>
              </View>
            </View>
          ))}
        </View>

        {weekBars.length > 0 && (
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600", marginBottom: 12 }}>
              ÚLTIMOS 7 DÍAS
            </Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
              {weekBars.map((wb) => (
                <View key={wb.key} style={{ width: 24, height: wb.barH, borderRadius: 4, backgroundColor: wb.color }} />
              ))}
            </View>
          </View>
        )}

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Aventuras activas
        </Text>
        {adventureCards.length === 0 ? (
          <Text style={{ color: theme.textSecondary }}>Todavía no tienes aventuras.</Text>
        ) : (
          adventureCards.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/adventures/${a.id}`)}
              style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>{a.title}</Text>
                <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>{a.pct}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 6, backgroundColor: theme.gradientFrom, overflow: "hidden", marginBottom: 6 }}>
                <View style={{ height: "100%", width: `${a.pct}%`, borderRadius: 6, backgroundColor: theme.textPrimary }} />
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                {a.completed} de {a.total} misiones
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}
```

Notes on specific decisions (so the next reader doesn't second-guess them):
- `trendArrow` is a verbatim port of `apps/web/components/ProgressBody.tsx`'s `trendInfo()`: same `n = min(5, floor(series.length/2))` window, same `0.25` threshold, same `inverted` flag for `stress` (a stress *decrease* counts as the positive `↑`-style direction, even though it's rendered here as a plain arrow without color-coding — color-coding the arrow itself is a cosmetic option left for a future polish pass, not required by the spec).
- `bars` keys use `c.id` (the check-in's real database id), not array index — stable and unique across re-renders, unlike an index-based key.
- The adventure completion bar's track color reuses `theme.gradientFrom` (there is no dedicated "track" field on `MobileTheme`) — same kind of creative reuse of existing theme fields the check-in screen's dot selectors already established, not a new theme field.
- `router.push(\`/adventures/${a.id}\`)` targets the exact same route Round A's Dashboard already uses — no new route needed.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/progress.tsx
git commit -m "feat(mobile): add Progress screen"
```

---

### Task 2: Dashboard entry point

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: the `/progress` route (Task 1); `useRouter` (`expo-router`, already imported in this file from Round B).

- [ ] **Step 1: Add the "Ver mi progreso" button**

In `apps/mobile/src/app/(tabs)/index.tsx`, change this existing block (added in Round B):

```tsx
        <Pressable
          onPress={() => router.push("/checkin")}
          style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 24 }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>Hacer check-in</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>
```

to:

```tsx
        <Pressable
          onPress={() => router.push("/checkin")}
          style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12 }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>Hacer check-in</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/progress")}
          style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 24 }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>Ver mi progreso</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>
```

(The only changes: the "Hacer check-in" button's `marginBottom` drops from `24` to `12` so the two buttons sit closer together, and the new "Ver mi progreso" button is inserted right after it, keeping the `marginBottom: 24` spacing before "Tus aventuras".)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output (the `/progress` route already exists from Task 1, so no typed-routes gap).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(tabs)/index.tsx"
git commit -m "feat(mobile): add Progress entry point to Dashboard"
```

---

### Task 3: Full end-to-end verification on a physical phone

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

Scan the QR code (or enter the `exp://<lan-ip>:8081` URL manually) with Expo Go, same LAN setup as prior rounds.

- [ ] **Step 2: Walk through the verification checklist**

1. Log in with `jose@aventuras.com` / `aventuras123` → Dashboard shows both "Hacer check-in" and "Ver mi progreso" buttons.
2. Tap "Ver mi progreso" → Progress screen loads: 4 metric cards (bars + average + trend arrow), a 7-day strip (if you have recent check-in history), a streak number, and up to 5 adventure cards with completion bars.
3. Cross-check the numbers: the streak here should match the Dashboard's streak; each adventure's `%`/`X de Y misiones` should match what you see inside that adventure's Adventure Detail screen.
4. Tap an adventure card → navigates to its Adventure Detail screen; tap "< Volver" there → returns to Progress (not the Dashboard).
5. Tap "< Volver" on Progress → returns to the Dashboard.
6. Stop the `apps/web` dev server, then navigate to Progress fresh (not a full app reload) → shows "No se pudo cargar tu progreso." with "Reintentar", not a crash. Restart the server, tap "Reintentar" → recovers and shows real data again.

- [ ] **Step 3: Report results**

If every step matches, Round C1 is complete. If a specific metric's average or trend arrow looks wrong for your actual check-in history, or an adventure's percentage doesn't match its Adventure Detail screen, note the specific discrepancy — don't guess at a fix without seeing the actual behavior.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — the Progress screen with metric cards/7-day strip/streak/adventure cards (Task 1), the Dashboard entry point (Task 2), manual verification of every behavior called out in the spec's Testing section (Task 3).
- **Scope check:** no CRUD, no `react-native-svg`, no per-adventure mission list on the cards, no shared hook — matching the spec's Non-Goals exactly.
- **Ordering:** Task 1 (Progress screen) is deliberately before Task 2 (Dashboard button referencing `/progress`), avoiding the same transient typed-routes gap called out in every prior round's plan.
- **Type consistency:** `AdventureDetail`/`CheckInData` (Task 1) are the exact existing types from `@/lib/types` (Round A) — no redefinition, no drift. `toDailyLatest` and `computeStreak` (Task 1) are byte-for-byte identical to the versions already in `checkin.tsx` (Round B) and `(tabs)/index.tsx` (Round A) respectively — confirmed by copying them verbatim rather than re-deriving. `trendArrow`'s formula and threshold match `apps/web/components/ProgressBody.tsx`'s `trendInfo()` exactly, as called out inline in Task 1.
