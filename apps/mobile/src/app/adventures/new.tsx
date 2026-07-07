import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";
import type { AdventureSummary } from "@/lib/types";

const PALETTES: [string, string, string][] = [
  ["#2C3A52", "#5E5670", "#A88098"],
  ["#C7DBE4", "#9DB6A4", "#7E9A86"],
  ["#F2D2A6", "#E3A878", "#C2825F"],
  ["#2C2A4E", "#5A4E78", "#9A7E9E"],
  ["#1E2C49", "#3E5A7E", "#7E9A86"],
];

type SaveState = { status: "idle" | "saving" | "error"; error?: string };

export default function NewAdventureScreen() {
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());

  const [title, setTitle] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const canCreate = title.trim().length >= 3;

  async function handleCreate() {
    if (!canCreate) return;
    setSaveState({ status: "saving" });
    try {
      const created = await apiRequest<AdventureSummary>("/api/mobile/adventures", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), paletteIdx }),
      });
      router.replace(`/adventures/${created.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la aventura.";
      setSaveState({ status: "error", error: message });
    }
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Nueva aventura
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          ¿Cómo se llama tu aventura?
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Recuperar el sueño"
          placeholderTextColor={theme.textSecondary}
          autoFocus
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
          Elige su paisaje
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
          onPress={handleCreate}
          disabled={!canCreate || saveState.status === "saving"}
          style={{
            backgroundColor: theme.textPrimary,
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            opacity: !canCreate || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Creando..." : "Crear aventura"}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}
