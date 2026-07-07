import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", flex: 1 }}>
            {adventure.title}
          </Text>
          <Pressable onPress={() => router.push(`/adventures/${id}/edit`)}>
            <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Editar</Text>
          </Pressable>
        </View>
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
