import { StyleSheet } from "react-native";
import { Colors } from "./Colors";

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Common border radius values
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

// Font sizes
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,
} as const;

// Create common styles for a given color scheme
export function createCommonStyles(isDark: boolean) {
  const colors = isDark ? Colors.dark : Colors.light;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: "600",
      color: colors.text,
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    textInput: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      fontSize: FontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: "center" as const,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: FontSize.lg,
      fontWeight: "700",
    },
    dangerButton: {
      backgroundColor: colors.error,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: "center" as const,
    },
    dangerButtonText: {
      color: "#FFFFFF",
      fontSize: FontSize.md,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.lg,
    },
  });
}
