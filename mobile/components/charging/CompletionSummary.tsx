import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { calcChargedKwh, calcCost, calcDurationMinutes } from "../../../shared/utils/calculations";
import { formatDuration } from "../../../shared/utils/formatting";
import { DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../../shared/constants/defaults";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useAppTheme } from "../../hooks/useTheme";
import type { ChargingRecord } from "../../../shared/types";
import type { TranslationMap } from "../../../shared/i18n/en";

interface CompletionSummaryProps {
  record: ChargingRecord;
  onDismiss: () => void;
  t: TranslationMap;
}

export function CompletionSummary({ record, onDismiss, t }: CompletionSummaryProps) {
  const { colors } = useAppTheme();
  const settings = useSettingsStore((s) => s.settings);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;
  const kwh = calcChargedKwh(capacity, record.startBattery, record.endBattery);
  const cost = calcCost(kwh, rate);
  const duration = calcDurationMinutes(record.startTime, record.endTime);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { backgroundColor: colors.card, transform: [{ scale }] }]}>
        {/* Check icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.success + "1A" }]}>
          <MaterialCommunityIcons name="check-bold" size={32} color={colors.success} />
        </View>

        <Text style={[styles.title, { color: colors.primary }]}>{t.chargeComplete}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{kwh.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>kWh</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{"\u00A5"}{cost}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.cost}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(duration)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.duration}</Text>
          </View>
        </View>

        <Text style={[styles.rangeText, { color: colors.textMuted }]}>
          {record.startBattery}% → {record.endBattery}%
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rangeText: {
    fontSize: 14,
  },
});
