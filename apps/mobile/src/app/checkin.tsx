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

function toDailyLatest(checkIns: CheckInData[]): CheckInData[] {
  const byDay = new Map<string, CheckInData>();
  for (const c of checkIns) {
    byDay.set(c.date.slice(0, 10), c);
  }
  return Array.from(byDay.values());
}

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

  const weekBars = toDailyLatest(weekStrip).slice(-7).map((c) => {
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
