import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Switch,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { useAppTheme } from "../../hooks/useTheme";
import {
  PRE_CONFIGURED_GAS_URL,
  DEFAULT_BATTERY_CAPACITY,
  DEFAULT_ELECTRICITY_RATE,
  DEFAULT_NIGHT_RATE,
  VEHICLE_PRESETS,
} from "../../../shared/constants/defaults";
import type { TranslationMap } from "../../../shared/i18n/en";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingProps {
  t: Translations;
  onComplete: () => void;
}

export function Onboarding({ t, onComplete }: OnboardingProps) {
  const { colors } = useAppTheme();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useToastStore((s) => s.showToast);
  const flatListRef = useRef<FlatList>(null);

  const [step, setStep] = useState(0);
  const [capacity, setCapacity] = useState(DEFAULT_BATTERY_CAPACITY);
  const [ratePlan, setRatePlan] = useState(DEFAULT_ELECTRICITY_RATE);
  const [nightRate, setNightRate] = useState(DEFAULT_NIGHT_RATE);
  const [useNightRate, setUseNightRate] = useState(false);
  const [gasUrl, setGasUrl] = useState(PRE_CONFIGURED_GAS_URL);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      const next = step + 1;
      setStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      updateSettings({ batteryCapacity: capacity, electricityRate: ratePlan, nightRate, useNightRate, gasUrl });
      showToast(t.toastWelcome, "success");
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
    }
  };

  const features = [
    { icon: "battery-charging" as const, text: t.feat1 },
    { icon: "chart-bar" as const, text: t.feat2 },
    { icon: "download" as const, text: t.feat3 },
    { icon: "cloud-sync" as const, text: t.feat4 },
  ];

  const pages = [
    // Step 0: Welcome
    <View key={0} style={styles.page}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + "1A" }]}>
        <MaterialCommunityIcons name="lightning-bolt" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>EV Gravity Logger</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>{t.welcomeSub1}</Text>
      <Text style={[styles.subtitleSmall, { color: colors.textMuted }]}>{t.welcomeSub2}</Text>
      <View style={[styles.featureBox, { backgroundColor: colors.surfaceAlt }]}>
        {features.map(({ icon, text }) => (
          <View key={text} style={styles.featureRow}>
            <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 14 }}>{text}</Text>
          </View>
        ))}
      </View>
    </View>,

    // Step 1: Vehicle Settings
    <View key={1} style={styles.page}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="car" size={22} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>{t.vehicleSettings}</Text>
      </View>
      <View style={styles.presetWrap}>
        {VEHICLE_PRESETS.map((preset) => (
          <Pressable
            key={preset.capacity}
            onPress={() => setCapacity(preset.capacity)}
            style={[
              styles.presetBtn,
              {
                borderColor: capacity === preset.capacity ? colors.primary : colors.border,
                backgroundColor: capacity === preset.capacity ? colors.primary + "0D" : "transparent",
              },
            ]}
          >
            <Text style={{ fontSize: 11, color: capacity === preset.capacity ? colors.primary : colors.textMuted }}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { color: colors.textMuted }]}>{t.batteryCapacity}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
        value={String(capacity)}
        onChangeText={(v) => setCapacity(Number(v) || 0)}
        keyboardType="numeric"
        textAlign="center"
      />
      <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>{t.azHint}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{t.electricityRate}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
        value={String(ratePlan)}
        onChangeText={(v) => setRatePlan(Number(v) || 0)}
        keyboardType="numeric"
        textAlign="center"
      />
      <View style={styles.nightRow}>
        <Switch value={useNightRate} onValueChange={setUseNightRate} trackColor={{ true: colors.primary }} />
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t.nightRate}</Text>
        {useNightRate && (
          <TextInput
            style={[styles.nightInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
            value={String(nightRate)}
            onChangeText={(v) => setNightRate(Number(v) || 0)}
            keyboardType="numeric"
          />
        )}
      </View>
    </View>,

    // Step 2: GAS
    <View key={2} style={styles.page}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="cloud-sync" size={22} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>{t.gSheetLink}</Text>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>{t.gSheetDesc}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text, fontSize: 13 }]}
        value={gasUrl}
        onChangeText={setGasUrl}
        placeholder="https://script.google.com/..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        multiline
      />
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{t.gSheetHint}</Text>
    </View>,
  ];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <View style={{ width: SCREEN_WIDTH }}>{item}</View>}
      />

      {/* Bottom controls */}
      <View style={styles.bottomArea}>
        <Pressable
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.nextBtnText}>
            {step < totalSteps - 1 ? t.next : t.startCharging}
          </Text>
        </Pressable>
        {step > 0 && (
          <Pressable onPress={handleBack} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t.back}</Text>
          </Pressable>
        )}
        {/* Dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 4 },
  subtitleSmall: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  featureBox: { borderRadius: 16, padding: 16, gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  stepTitle: { fontSize: 20, fontWeight: "600" },
  label: { fontSize: 12, marginBottom: 4 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 18, fontWeight: "500", marginBottom: 12 },
  presetWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  presetBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  nightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nightInput: { borderRadius: 8, borderWidth: 1, padding: 8, width: 80, fontSize: 14, marginLeft: "auto" },
  bottomArea: { padding: 24, paddingBottom: 40 },
  nextBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  nextBtnText: { color: "#FFF", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
