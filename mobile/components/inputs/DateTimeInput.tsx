import { useState } from "react";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "../../../shared/utils/formatting";
import { useAppTheme } from "../../hooks/useTheme";

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (isoString: string) => void;
  error?: boolean;
}

export function DateTimeInput({
  label,
  value,
  onChange,
  error = false,
}: DateTimeInputProps) {
  const { colors, isDark } = useAppTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const dateValue = value ? new Date(value) : new Date();

  const handleDateChange = (_: unknown, date?: Date) => {
    setShowDate(false);
    if (date) {
      const current = new Date(value || new Date());
      current.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      emitLocalISO(current);
      if (Platform.OS === "android") {
        setTimeout(() => setShowTime(true), 100);
      }
    }
  };

  const handleTimeChange = (_: unknown, date?: Date) => {
    setShowTime(false);
    if (date) {
      const current = new Date(value || new Date());
      current.setHours(date.getHours(), date.getMinutes());
      emitLocalISO(current);
    }
  };

  const emitLocalISO = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    onChange(local);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setShowDate(true)}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <Text style={[styles.inputText, { color: colors.text }]}>
          {value ? formatDate(value) : "--"}
        </Text>
      </Pressable>

      {showDate && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          themeVariant={isDark ? "dark" : "light"}
        />
      )}

      {showTime && (
        <DateTimePicker
          value={dateValue}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
          themeVariant={isDark ? "dark" : "light"}
        />
      )}

      {Platform.OS === "ios" && showDate && (
        <View style={styles.iosPickerContainer}>
          <DateTimePicker
            value={dateValue}
            mode="datetime"
            display="spinner"
            onChange={(_, d) => {
              if (d) emitLocalISO(d);
            }}
            themeVariant={isDark ? "dark" : "light"}
          />
          <Pressable
            onPress={() => setShowDate(false)}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      )}
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
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  inputText: {
    fontSize: 17,
    fontWeight: "500",
  },
  iosPickerContainer: {
    marginTop: 8,
  },
  doneBtn: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
