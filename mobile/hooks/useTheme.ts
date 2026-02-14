import { useColorScheme } from "react-native";
import { useSettingsStore } from "../store/useSettingsStore";
import { Colors } from "../constants/Colors";
import type { Theme } from "../../shared/types";

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.theme);

  const resolvedScheme = resolveTheme(themePreference, systemScheme);
  const isDark = resolvedScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return { isDark, colors, themePreference };
}

function resolveTheme(
  preference: Theme,
  systemScheme: "light" | "dark" | null | undefined,
): "light" | "dark" {
  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference;
}
