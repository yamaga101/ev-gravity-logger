// Extracted from Web index.css @theme
export const Colors = {
  light: {
    // EV Brand
    primary: "#10B981",
    primaryDark: "#059669",
    secondary: "#0EA5E9",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",

    // Surfaces
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFC",
    card: "#FFFFFF",

    // Text
    text: "#1E293B",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",

    // Borders
    border: "#E2E8F0",
    borderLight: "#F1F5F9",

    // Tab bar
    tabBarBackground: "#FFFFFF",
    tabBarBorder: "#E2E8F0",
    tabBarActive: "#10B981",
    tabBarInactive: "#94A3B8",
  },
  dark: {
    // EV Brand
    primary: "#10B981",
    primaryDark: "#059669",
    secondary: "#0EA5E9",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",

    // Surfaces
    background: "#0F172A",
    surface: "#1E293B",
    surfaceAlt: "#334155",
    card: "#1E293B",

    // Text
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",

    // Borders
    border: "#334155",
    borderLight: "#475569",

    // Tab bar
    tabBarBackground: "#1E293B",
    tabBarBorder: "#334155",
    tabBarActive: "#10B981",
    tabBarInactive: "#64748B",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
