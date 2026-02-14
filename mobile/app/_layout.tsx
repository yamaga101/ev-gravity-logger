import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useAppTheme } from "../hooks/useTheme";
import { useSettingsStore } from "../store/useSettingsStore";
import { Toast } from "../components/ui/Toast";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark, colors } = useAppTheme();
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!onboardingDone ? (
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}
