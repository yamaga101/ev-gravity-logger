import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useAppTheme } from "../hooks/useTheme";
import { useSettingsStore } from "../store/useSettingsStore";
import { useChargingStore } from "../store/useChargingStore";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { retryQueue } from "../../shared/utils/gas-sync";
import { Toast } from "../components/ui/Toast";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark, colors } = useAppTheme();
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const gasUrl = useSettingsStore((s) => s.settings.gasUrl);
  const offlineQueue = useChargingStore((s) => s.offlineQueue);
  const setQueue = useChargingStore((s) => s.setQueue);
  const isOnline = useNetworkStatus();
  const appState = useRef(AppState.currentState);

  const processQueue = useCallback(async () => {
    if (offlineQueue.length === 0 || !isOnline || !gasUrl) return;
    const { remaining } = await retryQueue(gasUrl, offlineQueue, isOnline);
    setQueue(remaining);
  }, [offlineQueue, isOnline, gasUrl, setQueue]);

  // Retry offline queue when app comes to foreground or network reconnects
  useEffect(() => {
    processQueue();
  }, [isOnline]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        processQueue();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [processQueue]);

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
