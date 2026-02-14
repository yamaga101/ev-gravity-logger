import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useToastStore } from "../../store/useToastStore";
import { Colors } from "../../constants/Colors";
import { useAppTheme } from "../../hooks/useTheme";

function ToastItem({ id, message, type, exiting }: {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  exiting: boolean;
}) {
  const { colors } = useAppTheme();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (exiting) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [exiting]);

  const borderColor =
    type === "success" ? Colors.light.success :
    type === "error" ? Colors.light.error :
    Colors.light.primary;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderLeftColor: borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={[styles.toastText, { color: borderColor }]}>{message}</Text>
    </Animated.View>
  );
}

export function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
