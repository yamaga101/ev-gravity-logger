import { useRef, useCallback, type ReactNode } from "react";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

interface RepeaterButtonProps {
  onPress: () => void;
  children: ReactNode;
  style?: object;
  delay?: number;
  interval?: number;
}

export function RepeaterButton({
  onPress,
  children,
  style,
  delay = 400,
  interval = 80,
}: RepeaterButtonProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fire = useCallback(() => {
    onPress();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onPress]);

  const handlePressIn = useCallback(() => {
    fire();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fire, interval);
    }, delay);
  }, [fire, delay, interval]);

  const handlePressOut = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}
