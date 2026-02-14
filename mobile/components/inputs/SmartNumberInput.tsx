import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { RepeaterButton } from "./RepeaterButton";
import { useAppTheme } from "../../hooks/useTheme";

interface SmartNumberInputProps {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  steps?: number[];
  min?: number;
  max?: number;
  error?: boolean;
}

export function SmartNumberInput({
  label,
  value,
  unit,
  onChange,
  steps = [-10, -1, 1, 10],
  min = 0,
  max = 999999,
  error = false,
}: SmartNumberInputProps) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const adjust = (delta: number) => {
    let next = parseFloat((value + delta).toFixed(1));
    if (next < min) next = min;
    if (next > max) next = max;
    onChange(next);
  };

  const handleEndEditing = () => {
    const parsed = parseFloat(tempValue);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (clamped < min) clamped = min;
      if (clamped > max) clamped = max;
      onChange(clamped);
    }
    setEditing(false);
  };

  const negSteps = steps.filter((s) => s < 0);
  const posSteps = steps.filter((s) => s > 0).reverse();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {/* Negative buttons */}
        <View style={styles.btnGroup}>
          {negSteps.map((step) => (
            <RepeaterButton
              key={step}
              onPress={() => adjust(step)}
              style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={[styles.stepText, { color: colors.error }]}>{step}</Text>
            </RepeaterButton>
          ))}
        </View>

        {/* Value display */}
        <View style={styles.valueContainer}>
          {editing ? (
            <TextInput
              style={[styles.valueInput, { color: colors.primary }]}
              keyboardType="numeric"
              defaultValue={String(value)}
              onChangeText={setTempValue}
              onEndEditing={handleEndEditing}
              onBlur={handleEndEditing}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Text
              style={[styles.valueText, { color: colors.primary }]}
              onPress={() => {
                setTempValue(String(value));
                setEditing(true);
              }}
            >
              {value}
            </Text>
          )}
          {unit ? (
            <Text style={[styles.unitText, { color: colors.textMuted }]}>{unit}</Text>
          ) : null}
        </View>

        {/* Positive buttons */}
        <View style={styles.btnGroup}>
          {posSteps.map((step) => (
            <RepeaterButton
              key={step}
              onPress={() => adjust(step)}
              style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={[styles.stepText, { color: colors.primary }]}>+{step}</Text>
            </RepeaterButton>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
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
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  btnGroup: {
    flexDirection: "row",
    gap: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "700",
  },
  valueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  valueText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  valueInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 60,
    padding: 0,
  },
  unitText: {
    fontSize: 12,
  },
});
