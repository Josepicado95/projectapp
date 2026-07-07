import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureDetail } from "@/lib/types";

const PALETTES: [string, string, string][] = [
  ["#2C3A52", "#5E5670", "#A88098"],
  ["#C7DBE4", "#9DB6A4", "#7E9A86"],
  ["#F2D2A6", "#E3A878", "#C2825F"],
  ["#2C2A4E", "#5A4E78", "#9A7E9E"],
  ["#1E2C49", "#3E5A7E", "#7E9A86"],
];

type LoadState = "loading" | "ready" | "error";
type SaveState = { status: "idle" | "saving" | "error"; error?: string };
type DeleteState = { status: "idle" | "deleting" | "error"; error?: string };

export default function EditAdventureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [adventure, setAdventure] = useState<AdventureDetail | null>(null);
  const [title, setTitle] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: "idle" });

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await apiRequest<AdventureDetail>(`/api/mobile/adventures/${id}`);
      setAdventure(data);
      setTitle(data.title);
      setPaletteIdx(data.paletteIdx);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canSave = title.trim().length >= 3;

  async function handleSave() {
    if (!canSave || !adventure) return;
    setSaveState({ status: "saving" });
    try {
      await apiRequest(`/api/mobile/adventures/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          description: adventure.description ?? undefined,
          status: adventure.status,
          paletteIdx,
        }),
      });
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar la aventura.";
      setSaveState({ status: "error", error: message });
    }
  }

  async function handleDelete() {
    setDeleteState({ status: "deleting" });
    try {
      await apiRequest(`/api/mobile/adventures/${id}`, { method: "DELETE" });
      router.dismissTo("/(tabs)");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo borrar la aventura.";
      setDeleteState({ status: "error", error: message });
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Eliminar aventura",
      "Se borrarán también todas sus misiones. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  if (loadState === "loading") {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.textPrimary} />
      </LinearGradient>
    );
  }

  if (loadState === "error" || !adventure) {
    return (
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 16, textAlign: "center" }}>
          No se pudo cargar la aventura.
        </Text>
        <Pressable onPress={load} style={{ backgroundColor: "rgba(255,255,255,.2)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: theme.textPrimary, fontWeight: "700" }}>Reintentar</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Editar aventura
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Nombre
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nombre de la aventura"
          placeholderTextColor={theme.textSecondary}
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 14,
            padding: 14,
            fontSize: 15,
            color: theme.textPrimary,
            marginBottom: 24,
          }}
        />

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Paisaje
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          {PALETTES.map((colors, i) => (
            <Pressable key={i} onPress={() => setPaletteIdx(i)} style={{ flex: 1 }}>
              <LinearGradient
                colors={colors}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: i === paletteIdx ? 2 : 0,
                  borderColor: theme.textPrimary,
                }}
              />
            </Pressable>
          ))}
        </View>

        {saveState.status === "error" && (
          <Text style={{ color: "#F0A0A0", marginBottom: 14, textAlign: "center" }}>{saveState.error}</Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={!canSave || saveState.status === "saving"}
          style={{
            backgroundColor: theme.textPrimary,
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            marginBottom: 14,
            opacity: !canSave || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>

        {deleteState.status === "error" && (
          <Text style={{ color: "#F0A0A0", marginBottom: 14, textAlign: "center" }}>{deleteState.error}</Text>
        )}

        <Pressable
          onPress={confirmDelete}
          disabled={deleteState.status === "deleting"}
          style={{
            backgroundColor: "rgba(220,80,80,.15)",
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            opacity: deleteState.status === "deleting" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#F0A0A0", fontWeight: "700" }}>
            {deleteState.status === "deleting" ? "Eliminando..." : "Eliminar aventura"}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
