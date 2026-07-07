import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { apiRequest, ApiError } from "@/lib/api";
import { getMobileMoment } from "@/lib/mobile-theme";

const DIFFICULTY_LEVELS = [
  { value: 1, label: "Suave" },
  { value: 2, label: "Media" },
  { value: 3, label: "Reto" },
];

type SaveState = { status: "idle" | "saving" | "error"; error?: string };
type DeleteState = { status: "idle" | "deleting" | "error"; error?: string };

export default function MissionFormScreen() {
  const { id, missionId, title: titleParam, difficulty: difficultyParam } = useLocalSearchParams<{
    id: string;
    missionId: string;
    title?: string;
    difficulty?: string;
  }>();
  const router = useRouter();
  const theme = getMobileMoment(new Date().getHours());
  const isNew = missionId === "new";

  const [title, setTitle] = useState(isNew ? "" : titleParam ?? "");
  const [difficulty, setDifficulty] = useState(isNew ? 2 : Number(difficultyParam) || 2);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: "idle" });

  const canSave = title.trim().length >= 3;

  async function handleSave() {
    if (!canSave) return;
    setSaveState({ status: "saving" });
    try {
      if (isNew) {
        await apiRequest(`/api/mobile/adventures/${id}/missions`, {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), difficulty }),
        });
      } else {
        await apiRequest(`/api/mobile/missions/${missionId}`, {
          method: "PATCH",
          body: JSON.stringify({ title: title.trim(), difficulty }),
        });
      }
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo guardar la misión.";
      setSaveState({ status: "error", error: message });
    }
  }

  async function handleDelete() {
    setDeleteState({ status: "deleting" });
    try {
      await apiRequest(`/api/mobile/missions/${missionId}`, { method: "DELETE" });
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo borrar la misión.";
      setDeleteState({ status: "error", error: message });
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Eliminar misión",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  return (
    <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary }}>{"< Volver"}</Text>
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          {isNew ? "Nueva misión" : "Editar misión"}
        </Text>

        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          Misión
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Terminar curso de React"
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
          Dificultad
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          {DIFFICULTY_LEVELS.map((lv) => (
            <Pressable
              key={lv.value}
              onPress={() => setDifficulty(lv.value)}
              style={{
                flex: 1,
                backgroundColor: difficulty === lv.value ? theme.textPrimary : theme.cardBg,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: difficulty === lv.value ? theme.gradientFrom : theme.textPrimary, fontWeight: "700" }}>
                {lv.label}
              </Text>
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
            marginBottom: isNew ? 0 : 14,
            opacity: !canSave || saveState.status === "saving" ? 0.5 : 1,
          }}
        >
          <Text style={{ color: theme.gradientFrom, fontWeight: "700" }}>
            {saveState.status === "saving" ? "Guardando..." : isNew ? "Crear misión" : "Guardar cambios"}
          </Text>
        </Pressable>

        {!isNew && (
          <>
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
                {deleteState.status === "deleting" ? "Eliminando..." : "Eliminar misión"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
