import { useEffect } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { AuthProvider, homeRouteFor, useAuth } from "@/context/AuthContext";
import { ErrorState, LoadingState, Screen } from "@/components";
import { colors } from "@/theme";
import type { Role } from "@/types/api";

SplashScreen.preventAutoHideAsync();

const GROUP_FOR_ROLE: Record<Role, string> = { PARTICIPANT: "(participant)", ORGANIZER: "(organizer)", JUDGE: "(judge)" };
const ROLE_GROUPS = Object.values(GROUP_FOR_ROLE);

/** Role-based routing: signed-in users stay in their own group; guests can browse as participants. */
function Gate() {
  const { status, user, bootError, retryBoot } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const group = segments[0] as string | undefined;

  useEffect(() => {
    if (status === "loading" || status === "error") return;
    if (status === "signedIn" && user) {
      const wrongGroup = group === "(auth)" || (ROLE_GROUPS.includes(group ?? "") && group !== GROUP_FOR_ROLE[user.role]);
      if (wrongGroup) router.replace(homeRouteFor(user.role));
    } else if (group === "(organizer)" || group === "(judge)") {
      router.replace("/(participant)/home");
    }
  }, [status, user, group, router]);

  if (status === "loading") return <Screen scroll={false}><LoadingState label="Starting Nexora" /></Screen>;
  if (status === "error" && bootError) return <Screen scroll={false}><ErrorState error={bootError} onRetry={retryBoot} /></Screen>;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: "slide_from_right" }} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Manrope_700Bold, Manrope_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, JetBrainsMono_500Medium });
  useEffect(() => { if (loaded) void SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider><Gate /></AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
