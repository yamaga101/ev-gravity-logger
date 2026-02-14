import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProgressRing } from "../ui/ProgressRing";
import { SmartNumberInput } from "../inputs/SmartNumberInput";
import { DateTimeInput } from "../inputs/DateTimeInput";
import { CompletionSummary } from "./CompletionSummary";
import { useChargingStore } from "../../store/useChargingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useAppTheme } from "../../hooks/useTheme";
import {
  calcChargedKwh,
  calcCost,
  calcDurationMinutes,
  calcChargeSpeed,
} from "../../../shared/utils/calculations";
import { buildGasPayload, sendToGas } from "../../../shared/utils/gas-sync";
import {
  formatTimer,
  formatDate,
  getLocalISOString,
} from "../../../shared/utils/formatting";
import {
  DEFAULT_BATTERY_CAPACITY,
  DEFAULT_ELECTRICITY_RATE,
  MAX_CHARGE_HOURS,
} from "../../../shared/constants/defaults";
import type { TranslationMap } from "../../../shared/i18n/en";
import type { ChargingRecord } from "../../../shared/types";

interface LiveChargingScreenProps {
  t: TranslationMap;
}

export function LiveChargingScreen({ t }: LiveChargingScreenProps) {
  const { colors } = useAppTheme();
  const isOnline = useNetworkStatus();
  const session = useChargingStore((s) => s.activeSession)!;
  const addRecord = useChargingStore((s) => s.addRecord);
  const clearSession = useChargingStore((s) => s.clearSession);
  const addToQueue = useChargingStore((s) => s.addToQueue);
  const settings = useSettingsStore((s) => s.settings);
  const showToast = useToastStore((s) => s.showToast);

  const [elapsed, setElapsed] = useState(0);
  const [endTime, setEndTime] = useState(getLocalISOString());
  const [endBattery, setEndBattery] = useState(Math.min(session.startBattery + 20, 100));
  const [endRange, setEndRange] = useState(session.startRange + 50);
  const [isSaving, setIsSaving] = useState(false);
  const [completionRecord, setCompletionRecord] = useState<ChargingRecord | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const startMs = new Date(session.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startTime]);

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;
  const locationKw = Number(session.kw) || 3;

  // Live estimates
  const remainPct = 100 - session.startBattery;
  const remainKwh = (capacity * remainPct) / 100;
  const estTotalMinutes = locationKw > 0 ? (remainKwh / locationKw) * 60 : 0;
  const estCompletionTime = new Date(
    new Date(session.startTime).getTime() + estTotalMinutes * 60000,
  );
  const elapsedKwh = locationKw * (elapsed / 3600);
  const liveCost = Math.round(elapsedKwh * rate);
  const currentPct = Math.min(100, session.startBattery + (elapsedKwh / capacity) * 100);
  const progress =
    remainPct > 0
      ? Math.min(100, ((currentPct - session.startBattery) / remainPct) * 100)
      : 100;

  const validate = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (endBattery < session.startBattery) {
      errors.endBattery = true;
      showToast(t.valEndBattery, "error");
    }
    if (endRange < session.startRange) {
      errors.endRange = true;
      showToast(t.valEndRange, "error");
    }
    if (new Date(endTime) <= new Date(session.startTime)) {
      errors.endTime = true;
      showToast(t.valEndTime, "error");
    }
    const durationHours =
      (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 3600000;
    if (durationHours > MAX_CHARGE_HOURS) {
      errors.endTime = true;
      showToast(t.valDuration.replace("{n}", String(MAX_CHARGE_HOURS)), "error");
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) return;
    setIsSaving(true);

    const chargedKwh = calcChargedKwh(capacity, session.startBattery, endBattery);
    const cost = calcCost(chargedKwh, rate);
    const duration = calcDurationMinutes(session.startTime, endTime);
    const chargeSpeed = calcChargeSpeed(chargedKwh, duration);

    const finalRecord: ChargingRecord = {
      ...session,
      endTime,
      endBattery,
      endRange,
      chargedKwh: parseFloat(chargedKwh.toFixed(1)),
      cost,
      duration: Math.round(duration),
      chargeSpeed: parseFloat(chargeSpeed.toFixed(1)),
    };

    addRecord(finalRecord);
    clearSession();

    const gasUrl = settings.gasUrl;
    if (gasUrl) {
      const payload = buildGasPayload(finalRecord);
      const success = await sendToGas(gasUrl, payload);
      if (success) {
        showToast(t.toastSavedSent, "success");
      } else {
        addToQueue(payload);
        showToast(t.toastSavedQueued, "info");
      }
    } else {
      showToast(t.toastSessionSaved, "success");
    }

    setIsSaving(false);
    setCompletionRecord(finalRecord);
  };

  const handleCancel = () => {
    Alert.alert("", t.confirmCancelSession, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: () => {
          clearSession();
          setValidationErrors({});
        },
      },
    ]);
  };

  if (completionRecord) {
    return (
      <CompletionSummary
        record={completionRecord}
        onDismiss={() => setCompletionRecord(null)}
        t={t}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary + "33" }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="battery-charging" size={20} color={colors.primary} />
            <Text style={[styles.headerText, { color: colors.primary }]}>{t.charging}</Text>
          </View>
          <Pressable onPress={handleCancel}>
            <Text style={{ color: colors.textMuted, fontSize: 13, textDecorationLine: "underline" }}>
              {t.cancel}
            </Text>
          </Pressable>
        </View>

        {/* Progress Ring + Timer */}
        <View style={styles.ringContainer}>
          <ProgressRing radius={70} stroke={6} progress={progress} />
          <View style={styles.ringOverlay}>
            <Text style={[styles.timerText, { color: colors.primary }]}>{formatTimer(elapsed)}</Text>
            <Text style={[styles.timerLabel, { color: colors.textMuted }]}>{t.elapsed}</Text>
          </View>
        </View>

        {/* Live Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.estPct}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{Math.round(currentPct)}%</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.cost}</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{"\u00A5"}{liveCost}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.estDone}</Text>
            <Text style={[styles.statValueSm, { color: colors.text }]}>
              {estCompletionTime.getHours().toString().padStart(2, "0")}:
              {estCompletionTime.getMinutes().toString().padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Session Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              {t.start}: {formatDate(session.startTime)}
            </Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              {session.startBattery}% / {session.startRange}km
            </Text>
          </View>
          {session.locationName ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                {session.locationName} ({locationKw}kW)
              </Text>
            </View>
          ) : null}
        </View>

        {/* End Inputs */}
        <DateTimeInput
          label={t.endTime}
          value={endTime}
          onChange={setEndTime}
          error={validationErrors.endTime}
        />
        <SmartNumberInput
          label={t.battEnd}
          value={endBattery}
          unit="%"
          min={0}
          max={100}
          onChange={setEndBattery}
          error={validationErrors.endBattery}
        />
        <SmartNumberInput
          label={t.rangeEnd}
          value={endRange}
          unit="km"
          steps={[-10, -1, 1, 10]}
          min={0}
          max={1000}
          onChange={setEndRange}
          error={validationErrors.endRange}
        />

        {/* Complete Button */}
        <Pressable
          onPress={handleComplete}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.completeBtn,
            { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.completeBtnText}>
            {isSaving ? t.saving : t.completeAndSave}
          </Text>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  ringOverlay: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 28,
    fontWeight: "600",
  },
  timerLabel: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
  },
  statValueSm: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoText: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  completeBtn: {
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
  completeBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
