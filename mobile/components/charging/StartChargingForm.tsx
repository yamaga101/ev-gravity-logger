import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SmartNumberInput } from "../inputs/SmartNumberInput";
import { DateTimeInput } from "../inputs/DateTimeInput";
import { Odometer } from "../inputs/Odometer";
import { useChargingStore } from "../../store/useChargingStore";
import { useLocationStore } from "../../store/useLocationStore";
import { generateId, getLocalISOString } from "../../../shared/utils/formatting";
import { useAppTheme } from "../../hooks/useTheme";
import type { Translations } from "../../../shared/i18n/en";

interface StartChargingFormProps {
  t: Translations;
}

export function StartChargingForm({ t }: StartChargingFormProps) {
  const { colors } = useAppTheme();
  const history = useChargingStore((s) => s.history);
  const startSession = useChargingStore((s) => s.startSession);
  const locations = useLocationStore((s) => s.locations);

  const lastRecord = history[0];
  const [startTime, setStartTime] = useState(getLocalISOString());
  const [odometer, setOdometer] = useState(lastRecord?.odometer ?? 10000);
  const [startBattery, setStartBattery] = useState(lastRecord?.endBattery ?? 50);
  const [startRange, setStartRange] = useState(lastRecord?.endRange ?? 200);
  const [efficiency, setEfficiency] = useState(lastRecord?.efficiency ?? 6.0);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  const handleStart = () => {
    const loc = selectedLocation;
    startSession({
      id: generateId(),
      startTime,
      odometer,
      startBattery,
      startRange,
      efficiency,
      startedAt: Date.now(),
      locationName: loc?.name ?? "",
      voltage: loc?.voltage ?? "",
      amperage: loc?.amperage ?? "",
      kw: loc?.kw ?? "",
    });
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="ev-plug-type2" size={20} color={colors.primary} />
          <Text style={[styles.headerText, { color: colors.primary }]}>{t.startCharging}</Text>
        </View>

        <DateTimeInput label={t.startTime} value={startTime} onChange={setStartTime} />
        <Odometer value={odometer} onChange={setOdometer} label={t.odometer} />

        <SmartNumberInput
          label={t.batteryPct}
          value={startBattery}
          unit="%"
          min={0}
          max={100}
          onChange={setStartBattery}
        />
        <SmartNumberInput
          label={t.rangeKm}
          value={startRange}
          unit="km"
          steps={[-10, -1, 1, 10]}
          min={0}
          max={1000}
          onChange={setStartRange}
        />
        <SmartNumberInput
          label={t.efficiency}
          value={efficiency}
          unit=""
          steps={[-1, -0.1, 0.1, 1]}
          min={0}
          max={20}
          onChange={setEfficiency}
        />

        {/* Location Selector */}
        <View style={styles.locationSection}>
          <View style={styles.locationLabelRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.chargingLocation}</Text>
          </View>
          <Pressable
            onPress={() => setShowLocationPicker(!showLocationPicker)}
            style={[styles.locationBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>
              {selectedLocation ? `${selectedLocation.name} (${selectedLocation.kw}kW)` : t.manualUnspecified}
            </Text>
            <MaterialCommunityIcons
              name={showLocationPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
          {showLocationPicker && (
            <View style={[styles.locationList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable
                onPress={() => { setSelectedLocationId(""); setShowLocationPicker(false); }}
                style={[styles.locationItem, !selectedLocationId && { backgroundColor: colors.surfaceAlt }]}
              >
                <Text style={{ color: colors.text }}>{t.manualUnspecified}</Text>
              </Pressable>
              {locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => { setSelectedLocationId(loc.id); setShowLocationPicker(false); }}
                  style={[styles.locationItem, selectedLocationId === loc.id && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={{ color: colors.text }}>{loc.name} ({loc.kw}kW)</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Start Button */}
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.startBtnText}>{t.startCharging}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationSection: {
    marginBottom: 8,
  },
  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
    paddingLeft: 4,
  },
  locationBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  locationList: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  locationItem: {
    padding: 12,
  },
  startBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
