import { View, Text } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-[#1E282A]">
      <Text className="text-xl text-[#ECE6D8]">Hola, {user?.name}</Text>
    </View>
  );
}
