import { View, Text, Pressable } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-[#1E282A] px-6">
      <Text className="text-lg text-[#ECE6D8] mb-6">{user?.email}</Text>
      <Pressable className="bg-[#C48FB4] rounded-xl px-6 py-3" onPress={logout}>
        <Text className="text-[#1E282A] font-bold">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
