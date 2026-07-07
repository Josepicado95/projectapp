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
