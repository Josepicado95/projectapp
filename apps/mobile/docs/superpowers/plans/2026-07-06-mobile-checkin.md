# Mobile Check-In (Round B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a check-in submission wizard to `apps/mobile` (energy/mood/stress/sleep, 1-5 each), reachable from the Dashboard, wired against the existing `/api/mobile/checkins` endpoint — no backend changes.

**Architecture:** A new, self-contained stack screen (`checkin.tsx`) owns its own wizard state (step 0-5, values) and its own fetch/save calls — no shared hook, matching the precedent Round A set with Adventure Detail. The Dashboard gains an entry-point button and a `useFocusEffect` that refetches its own data every time it regains focus, so the streak reflects a just-saved check-in without any explicit cross-screen signaling.

**Tech Stack:** Expo Router, TypeScript, NativeWind, `expo-linear-gradient` (already installed from Round A) — no new dependencies.

**Spec:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-checkin-design.md`

## Global Constraints

- Run all commands in this plan from `apps/mobile/` unless a step says otherwise.
- All new source files use English identifiers; user-facing text (labels, error messages) is Spanish — same convention as the rest of `apps/mobile`.
- No automated test framework — verification is `npx tsc --noEmit` per task, plus a final manual pass on a physical phone via Expo Go (per the spec's Testing section).
- Import other `apps/mobile/src/*` modules via the `@/` alias, matching the existing convention.
- No changes to `apps/web` or any `/api/mobile/*` route handler — this plan is a pure consumer of the already-shipped `/api/mobile/checkins` endpoint.
- No new files under `src/lib/` — the check-in screen reuses `apiRequest`/`ApiError` (`@/lib/api`), `getMobileMoment` (`@/lib/mobile-theme`), and `CheckInData` (`@/lib/types`), all already built in Round A.
- Task ordering is deliberate: the check-in screen (Task 1) is built *before* the Dashboard references it (Task 2), so there's never a moment where `router.push("/checkin")` points at a route that doesn't exist yet — same transient-typed-routes avoidance Round A used for Adventure Detail vs. Dashboard.

---

### Task 1: Check-in wizard screen

**Files:**
- Create: `apps/mobile/src/app/checkin.tsx`

**Interfaces:**
- Consumes: `apiRequest<T>`, `ApiError` (`@/lib/api`, existing); `CheckInData` (`@/lib/types`, existing); `getMobileMoment` (`@/lib/mobile-theme`, existing); `useRouter` (`expo-router`).
- Produces: the route `/checkin`, consumed by Task 2's `router.push`.

This task is self-contained (own local fetch + wizard state) and does not depend on `useDashboardData()` — deliberately, per the spec's Architecture section (avoid growing a shared hook for single-consumer logic).

- [ ] **Step 1: Write the screen**

Create `apps/mobile/src/app/checkin.tsx`:

```tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { CheckInData } from "@/lib/types";

type MetricKey = "energy" | "mood" | "stress" | "sleep";
type Values = Record<MetricKey, number>;

type Metric = {
  key: MetricKey;
  icon: string;
  question: string;
  hint: string;
  low: string;
  high: string;
  levels: string[];
};

const METRICS: Metric[] = [
  {
    key: "energy",
    icon: "⚡",
    question: "¿Cuánta energía sientes hoy?",
    hint: "Cómo se siente tu cuerpo en este momento.",
    low: "Sin fuerza",
    high: "Rebosante",
    levels: ["Sin fuerza", "Cansado", "Normal", "Bastante", "Rebosante"],
  },
  {
    key: "mood",
    icon: "🌤",
    question: "¿Cómo está tu estado de ánimo?",
    hint: "Tu sensación emocional general de hoy.",
    low: "Muy bajo",
    high: "Excelente",
    levels: ["Muy bajo", "Algo bajo", "Estable", "Bien", "Excelente"],
  },
  {
    key: "stress",
    icon: "🌀",
    question: "¿Cuánto estrés estás cargando?",
    hint: "Tensión mental o sensación de estar desbordado.",
    low: "Sin estrés",
    high: "Saturado",
    levels: ["Sin estrés", "Poco", "Moderado", "Bastante", "Saturado"],
  },
  {
    key: "sleep",
    icon: "🌙",
    question: "¿Cómo dormiste anoche?",
    hint: "Calidad y descanso del sueño de la noche pasada.",
    low: "Muy mal",
    high: "Muy bien",
    levels: ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"],
  },
];

const DEFAULT_VALUES: Values = { energy: 3, mood: 3, stress: 3, sleep: 3 };

type LoadState = "loading" | "ready" | "error";
type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function CheckInScreen() {
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(DEFAULT_VALUES);
  const [weekStrip, setWeekStrip] = useState<CheckInData[]>([]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [todayRes, weekRes] = await Promise.all([
        apiRequest<{ checkIn: CheckInData | null }>("/api/mobile/checkins?today=true"),
        apiRequest<CheckInData[]>("/api/mobile/checkins?days=7"),
      ]);
      setWeekStrip(weekRes);
      if (todayRes.checkIn) {
        setValues(todayRes.checkIn);
        setStep(5);
      } else {
        setValues(DEFAULT_VALUES);
        setStep(0);
      }
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaveState({ status: "saving" });
    try {
      await apiRequest("/api/mobile/checkins", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSaveState({ status: "idle" });
      setStep(5);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar el check-in.";
      setSaveState({ status: "error", error: message });
    }
  }

  function startNewCheckIn() {
    setValues(DEFAULT_VALUES);
    setSaveState({ status: "idle" });
    setStep(0);
  }

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
          No se pudo cargar tu check-in.
        </Text>
        <Pressable onPress={load} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Reintentar</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const weekBars = weekStrip.slice(-7).map((c) => {
    const avg = (c.energy + c.mood + c.sleep) / 3;
    const barH = Math.max(6, Math.round((avg / 5) * 28));
    const color = avg >= 4 ? "#7E9A86" : avg >= 3 ? "#7EB8D8" : avg >= 2 ? "#E3A878" : "#C48FB4";
    return { key: c.id, barH, color };
  });

  const now = new Date();
  const dateLabel = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const currentMetric = step >= 1 && step <= 4 ? METRICS[step - 1] : null;

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        {step < 5 && (
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
          </Pressable>
        )}

        {step === 0 && (
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4 }}>
              Tu check-in de hoy
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24, textTransform: "capitalize" }}>
              {dateLabel}
            </Text>

            {weekBars.length > 0 && (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 32, alignItems: "flex-end" }}>
                {weekBars.map((wb) => (
                  <View key={wb.key} style={{ width: 24, height: wb.barH, borderRadius: 4, backgroundColor: wb.color }} />
                ))}
              </View>
            )}

            <Pressable
              onPress={() => setStep(1)}
              style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 18, alignItems: "center" }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>Empezar →</Text>
            </Pressable>
          </View>
        )}

        {currentMetric && (
          <View>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
              {METRICS.map((m, i) => (
                <View
                  key={m.key}
                  style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= step - 1 ? theme.textPrimary : theme.cardBg }}
                />
              ))}
            </View>

            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>{currentMetric.icon}</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 6 }}>
                {currentMetric.question}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center" }}>{currentMetric.hint}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const sel = n === values[currentMetric.key];
                return (
                  <Pressable
                    key={n}
                    onPress={() => setValues((v) => ({ ...v, [currentMetric.key]: n }))}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: sel ? theme.textPrimary : theme.cardBg,
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: sel ? theme.gradientFrom : theme.textPrimary }}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ color: theme.textPrimary, textAlign: "center", fontWeight: "600", marginBottom: 32 }}>
              {currentMetric.levels[values[currentMetric.key] - 1]}
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setStep(step - 1)}
                style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: theme.cardBg, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: theme.textPrimary, fontSize: 18 }}>←</Text>
              </Pressable>

              {step < 4 ? (
                <Pressable
                  onPress={() => setStep(step + 1)}
                  style={{ flex: 1, backgroundColor: theme.textPrimary, borderRadius: 14, padding: 15, alignItems: "center" }}
                >
                  <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>Siguiente →</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSave}
                  disabled={saveState.status === "saving"}
                  style={{ flex: 1, backgroundColor: theme.textPrimary, borderRadius: 14, padding: 15, alignItems: "center", opacity: saveState.status === "saving" ? 0.6 : 1 }}
                >
                  <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
                    {saveState.status === "saving" ? "Guardando..." : "Guardar check-in"}
                  </Text>
                </Pressable>
              )}
            </View>

            {saveState.status === "error" && (
              <Text style={{ color: "#F0A0A0", marginTop: 14, textAlign: "center" }}>{saveState.error}</Text>
            )}
          </View>
        )}

        {step === 5 && (
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 4, textAlign: "center" }}>
              Check-in guardado
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24, textAlign: "center" }}>
              Tu momento de hoy está registrado.
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
              {METRICS.map((m) => (
                <View key={m.key} style={{ width: "47%", backgroundColor: theme.cardBg, borderRadius: 16, padding: 14 }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "700" }}>{values[m.key]}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{m.levels[values[m.key] - 1]}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={startNewCheckIn}
              style={{ backgroundColor: theme.cardBg, borderRadius: 14, padding: 15, alignItems: "center", marginBottom: 10 }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Hacer otro check-in</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={{ backgroundColor: theme.textPrimary, borderRadius: 14, padding: 15, alignItems: "center" }}
            >
              <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>Volver al Dashboard</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
```

Notes on specific decisions (so the next reader doesn't second-guess them):
- `todayRes.checkIn` (typed `CheckInData | null`) is assigned directly into `values` (typed `Values`, a strict subset of `CheckInData`'s fields). This compiles because `CheckInData` structurally contains every field `Values` needs (`energy`/`mood`/`stress`/`sleep`) plus extras (`id`/`date`) — TypeScript allows assigning a wider object to a narrower variable target since this isn't an object-literal excess-property check.
- The save-failure branch (`catch (err)` in `handleSave`) never calls `setValues(...)` — the user's answers must survive a failed save so they can retry without re-answering (spec's Error Handling section).
- `weekBars` uses `(energy + mood + sleep) / 3` — deliberately excluding `stress`, matching `apps/web`'s `CheckInBody.tsx` `weekBars` computation exactly (its inverse scale would otherwise skew the average).

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/checkin.tsx
git commit -m "feat(mobile): add check-in wizard screen"
```

---

### Task 2: Dashboard entry point + focus-triggered refetch

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useDashboardData` (`@/lib/use-dashboard-data`, existing — specifically its returned `refetch`); `useFocusEffect` (`expo-router`); the `/checkin` route (Task 1).

- [ ] **Step 1: Add the `useFocusEffect` import**

In `apps/mobile/src/app/(tabs)/index.tsx`, change the import line:

```tsx
import { useRouter } from "expo-router";
```

to:

```tsx
import { useRouter, useFocusEffect } from "expo-router";
```

- [ ] **Step 2: Add `useCallback` to the React import**

Change:

```tsx
import { useMemo } from "react";
```

to:

```tsx
import { useCallback, useMemo } from "react";
```

- [ ] **Step 3: Call `useFocusEffect` to refetch on every return to this tab**

Right after this existing block:

```tsx
  const theme = useMemo(() => getMobileMoment(new Date().getHours()), []);
  const streak = useMemo(() => computeStreak(checkIns), [checkIns]);
```

add:

```tsx

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
```

- [ ] **Step 4: Add the "Hacer check-in" button**

Change this existing block:

```tsx
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24 }}>
          Racha actual: {streak} {streak === 1 ? "día" : "días"}
        </Text>

        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          Tus aventuras
        </Text>
```

to:

```tsx
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 24 }}>
          Racha actual: {streak} {streak === 1 ? "día" : "días"}
        </Text>

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

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no output (the `/checkin` route already exists from Task 1, so no typed-routes gap).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tabs)/index.tsx"
git commit -m "feat(mobile): add check-in entry point and focus refetch to Dashboard"
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

1. Log in with `jose@aventuras.com` / `aventuras123` → Dashboard shows a "Hacer check-in" button.
2. Tap it → check-in screen loads; if you haven't checked in today, it shows the intro (with a 7-day strip if you have recent history) and an "Empezar" button.
3. Complete the wizard (4 metric screens, "Siguiente" between them, "Guardar check-in" on the last one) → the summary screen shows the 4 values you picked with the matching level label.
4. Tap "Volver al Dashboard" → the streak number is already updated to include today (confirms the `useFocusEffect` refetch fired) without needing a manual reload.
5. Tap "Hacer check-in" again → this time it jumps straight to the summary screen (today's check-in already exists), not back to the wizard intro.
6. From that summary, tap "Hacer otro check-in" → returns to the intro with all 4 dot-selectors reset to the middle value (3).
7. Stop the `apps/web` dev server: reload the check-in screen (or navigate to it fresh) → shows a "No se pudo cargar tu check-in." error with a "Reintentar" button, not a crash. Restart the dev server, tap "Reintentar" → recovers normally.
8. With the server stopped again, get to step 4 of the wizard (last metric) and tap "Guardar check-in" → shows an inline error message under the button, and your 4 answers are still there (not reset) so you can retry once the server is back.

- [ ] **Step 3: Report results**

If every step matches, Round B is complete. If the streak doesn't update after returning from check-in, or the save-failure path clears your answers, note the specific discrepancy — don't guess at a fix without seeing the actual behavior.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — the wizard screen with its load/save/error behavior (Task 1), the Dashboard entry point and focus-triggered refetch (Task 2), manual verification of every behavior called out in the spec's Testing section (Task 3).
- **Scope check:** no editing/deleting past check-ins, no historical charts beyond the existing 7-day strip, no CRUD, no `sky-engine.ts` — matching the spec's Non-Goals exactly.
- **Ordering:** Task 1 (check-in screen) is deliberately before Task 2 (Dashboard button referencing `/checkin`), avoiding the same transient typed-routes gap Round A's plan called out for Adventure Detail vs. Dashboard.
- **Type consistency:** `Values` (Task 1, local to `checkin.tsx`) matches the exact shape the `POST /api/mobile/checkins` body schema expects (`energy`/`mood`/`stress`/`sleep`, each 1-5) — verified against `apps/web/app/api/mobile/checkins/route.ts`'s `CheckInSchema`. `CheckInData` (Task 1's week-strip fetch) matches the type already defined in `@/lib/types` from Round A — no redefinition. Task 2's `useFocusEffect(useCallback(() => { refetch(); }, [refetch]))` matches the hook's own documented usage pattern (memoized callback, per `expo-router`'s `useFocusEffect.d.ts`) and calls the exact `refetch` name `useDashboardData()` already returns.
- **Error-preservation detail:** `handleSave`'s catch branch intentionally never touches `values` — called out inline in Task 1 and re-verified in Task 3, Step 8, mirroring how Round A's plan called out the mission-toggle's revert-by-id logic as a specific detail to get right.
