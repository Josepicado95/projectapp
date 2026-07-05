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
    const onLoginScreen = segments[0] === "login";
    if (!user && inTabsGroup) {
      router.replace("/login");
    } else if (user && onLoginScreen) {
      // Only pull an authenticated user out of the login screen specifically —
      // don't force every authenticated route to live inside (tabs). Future
      // screens outside the tab bar (e.g. a detail screen) stay untouched here.
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
