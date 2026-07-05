import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo conectar. Revisa que tu celular y tu PC estén en la misma red Wi-Fi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 justify-center bg-[#1E282A] px-6">
      <Text className="text-2xl font-bold text-[#ECE6D8] mb-6">Aventuras</Text>
      <TextInput
        className="bg-[#2A363A] text-[#ECE6D8] rounded-xl px-4 py-3 mb-3"
        placeholder="Correo"
        placeholderTextColor="#8A9490"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-[#2A363A] text-[#ECE6D8] rounded-xl px-4 py-3 mb-3"
        placeholder="Contraseña"
        placeholderTextColor="#8A9490"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text className="text-[#F0A0A0] mb-3">{error}</Text>}
      <Pressable
        className="bg-[#7E9A86] rounded-xl py-3 items-center"
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-[#1E282A] font-bold">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Text>
      </Pressable>
    </View>
  );
}
