import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RepeaterButton } from "./RepeaterButton";
import { useAppTheme } from "../../hooks/useTheme";

interface OdometerDigitProps {
  value: number;
  onUp: () => void;
  onDown: () => void;
  primaryColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

function OdometerDigit({
  value,
  onUp,
  onDown,
  primaryColor,
  textColor,
  bgColor,
  borderColor,
}: OdometerDigitProps) {
  return (
    <View style={styles.digitCol}>
      <RepeaterButton onPress={onUp} style={styles.arrowBtn}>
        <MaterialCommunityIcons name="chevron-up" size={24} color={primaryColor} />
      </RepeaterButton>
      <View style={[styles.digitBox, { backgroundColor: bgColor, borderColor }]}>
        <Text style={[styles.digitText, { color: textColor }]}>{value}</Text>
      </View>
      <RepeaterButton onPress={onDown} style={styles.arrowBtn}>
        <MaterialCommunityIcons name="chevron-down" size={24} color={primaryColor} />
      </RepeaterButton>
    </View>
  );
}

interface OdometerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function Odometer({ value, onChange, label }: OdometerProps) {
  const { colors } = useAppTheme();
  const digits = String(value).padStart(6, "0").split("").map(Number);

  const updateDigit = (index: number, delta: number) => {
    const newDigits = [...digits];
    let val = newDigits[index] + delta;
    if (val > 9) val = 0;
    if (val < 0) val = 9;
    newDigits[index] = val;
    onChange(parseInt(newDigits.join("")));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {digits.map((d, i) => (
          <OdometerDigit
            key={i}
            value={d}
            onUp={() => updateDigit(i, 1)}
            onDown={() => updateDigit(i, -1)}
            primaryColor={colors.primary}
            textColor={colors.text}
            bgColor={colors.surfaceAlt}
            borderColor={colors.border}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingLeft: 4,
  },
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  digitCol: {
    alignItems: "center",
    gap: 4,
  },
  arrowBtn: {
    padding: 2,
  },
  digitBox: {
    width: 40,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  digitText: {
    fontSize: 28,
    fontWeight: "600",
  },
});
