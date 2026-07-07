import { useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

        <Pressable
          onPress={() => router.push("/checkin")}
          style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 24 }}
        >
          <Text style={{ color: theme.textPrimary, fontWeight: "700", fontSize: 15 }}>Hacer check-in</Text>
        </Pressable>

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
