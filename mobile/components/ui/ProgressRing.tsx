import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "../../constants/Colors";
import { useAppTheme } from "../../hooks/useTheme";

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress?: number;
  color?: string;
}

export function ProgressRing({
  radius = 70,
  stroke = 6,
  progress = 0,
  color = Colors.light.primary,
}: ProgressRingProps) {
  const { isDark } = useAppTheme();
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const trackColor = isDark ? "#374151" : "#E5E7EB";

  return (
    <View style={styles.container}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          stroke={trackColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          rotation={-90}
          origin={`${radius}, ${radius}`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
