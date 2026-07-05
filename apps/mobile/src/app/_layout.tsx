import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === "(tabs)";
    if (!user && inTabsGroup) {
      router.replace("/login");
    } else if (user && !inTabsGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
