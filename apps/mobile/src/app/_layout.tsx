import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const inTabsGroup = segments[0] === "(tabs)";
  const onLoginScreen = segments[0] === "login";
  const willRedirectToLogin = !isLoading && !user && inTabsGroup;
  const willRedirectToTabs = !isLoading && user && onLoginScreen;

  useEffect(() => {
    if (willRedirectToLogin) {
      router.replace("/login");
    } else if (willRedirectToTabs) {
      // Only pull an authenticated user out of the login screen specifically —
      // don't force every authenticated route to live inside (tabs). Future
      // screens outside the tab bar (e.g. a detail screen) stay untouched here.
      router.replace("/(tabs)");
    }
  }, [willRedirectToLogin, willRedirectToTabs, router]);

  if (isLoading || willRedirectToLogin || willRedirectToTabs) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
