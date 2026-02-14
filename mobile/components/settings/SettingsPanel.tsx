import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Switch, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLocationStore } from "../../store/useLocationStore";
import { useChargingStore } from "../../store/useChargingStore";
import { useToastStore } from "../../store/useToastStore";
import { useAppTheme } from "../../hooks/useTheme";
import { VEHICLE_PRESETS } from "../../../shared/constants/defaults";
import { exportJson } from "../../utils/json-io";
import type { ChargingLocation, Theme } from "../../../shared/types";
import type { TranslationMap } from "../../../shared/i18n/en";

interface SettingsPanelProps {
  t: Translations;
}

export function SettingsPanel({ t }: SettingsPanelProps) {
  const { colors } = useAppTheme();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const lang = useSettingsStore((s) => s.lang);
  const setLang = useSettingsStore((s) => s.setLang);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const locations = useLocationStore((s) => s.locations);
  const addLocation = useLocationStore((s) => s.addLocation);
  const updateLocation = useLocationStore((s) => s.updateLocation);
  const removeLocation = useLocationStore((s) => s.removeLocation);

  const history = useChargingStore((s) => s.history);
  const offlineQueue = useChargingStore((s) => s.offlineQueue);
  const showToast = useToastStore((s) => s.showToast);

  const [newLoc, setNewLoc] = useState<Omit<ChargingLocation, "id">>({ name: "", voltage: 200, amperage: 15, kw: 3.0 });
  const [editingLocId, setEditingLocId] = useState<string | null>(null);

  const handleSaveLocation = () => {
    if (!newLoc.name) return;
    if (editingLocId) {
      updateLocation(editingLocId, newLoc);
      setEditingLocId(null);
    } else {
      addLocation(newLoc);
    }
    setNewLoc({ name: "", voltage: 200, amperage: 15, kw: 3.0 });
  };

  const startEdit = (loc: ChargingLocation) => {
    setNewLoc({ name: loc.name, voltage: loc.voltage, amperage: loc.amperage, kw: loc.kw });
    setEditingLocId(loc.id);
  };

  const cancelEdit = () => {
    setNewLoc({ name: "", voltage: 200, amperage: 15, kw: 3.0 });
    setEditingLocId(null);
  };

  const themeOptions: { value: Theme; icon: string; label: string }[] = [
    { value: "light", icon: "white-balance-sunny", label: t.light },
    { value: "dark", icon: "moon-waning-crescent", label: t.dark },
    { value: "system", icon: "monitor", label: t.systemDefault },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Theme */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.theme}</Text>
      <View style={styles.themeRow}>
        {themeOptions.map(({ value, icon, label }) => (
          <Pressable
            key={value}
            onPress={() => setTheme(value)}
            style={[
              styles.themeBtn,
              {
                borderColor: theme === value ? colors.primary : colors.border,
                backgroundColor: theme === value ? colors.primary + "0D" : "transparent",
              },
            ]}
          >
            <MaterialCommunityIcons name={icon as any} size={18} color={theme === value ? colors.primary : colors.textMuted} />
            <Text style={{ fontSize: 12, fontWeight: "500", color: theme === value ? colors.primary : colors.textMuted }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Language */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.language}</Text>
      <View style={styles.langRow}>
        {(["en", "ja"] as const).map((l) => (
          <Pressable
            key={l}
            onPress={() => setLang(l)}
            style={[
              styles.langBtn,
              {
                borderColor: lang === l ? colors.primary : colors.border,
                backgroundColor: lang === l ? colors.primary + "0D" : "transparent",
              },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: "500", color: lang === l ? colors.primary : colors.textMuted }}>
              {l === "en" ? "English" : "日本語"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Vehicle */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.vehicle}</Text>
      <View style={styles.presetRow}>
        {VEHICLE_PRESETS.map((preset) => (
          <Pressable
            key={preset.capacity}
            onPress={() => updateSettings({ batteryCapacity: preset.capacity })}
            style={[
              styles.presetBtn,
              {
                borderColor: settings.batteryCapacity === preset.capacity ? colors.primary : colors.border,
                backgroundColor: settings.batteryCapacity === preset.capacity ? colors.primary + "0D" : "transparent",
              },
            ]}
          >
            <Text style={{ fontSize: 11, color: settings.batteryCapacity === preset.capacity ? colors.primary : colors.textMuted }}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>{t.batteryCapacity}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
        value={String(settings.batteryCapacity)}
        onChangeText={(v) => updateSettings({ batteryCapacity: Number(v) || 0 })}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>{t.electricityRate}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
        value={String(settings.electricityRate)}
        onChangeText={(v) => updateSettings({ electricityRate: Number(v) || 0 })}
        keyboardType="numeric"
      />

      <View style={styles.nightRateRow}>
        <Switch
          value={settings.useNightRate}
          onValueChange={(v) => updateSettings({ useNightRate: v })}
          trackColor={{ true: colors.primary }}
        />
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t.nightRate}</Text>
        {settings.useNightRate && (
          <TextInput
            style={[styles.nightRateInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
            value={String(settings.nightRate)}
            onChangeText={(v) => updateSettings({ nightRate: Number(v) || 0 })}
            keyboardType="numeric"
          />
        )}
      </View>

      {/* Locations */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{t.chargingLocations}</Text>
      {locations.map((loc) => (
        <View key={loc.id} style={[styles.locCard, { backgroundColor: colors.card, borderColor: editingLocId === loc.id ? colors.primary : colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontWeight: "500", fontSize: 14 }}>{loc.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{loc.voltage}V / {loc.amperage}A / {loc.kw}kW</Text>
          </View>
          <Pressable onPress={() => startEdit(loc)} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="pencil" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => removeLocation(loc.id)} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
          </Pressable>
        </View>
      ))}
      {locations.length === 0 && (
        <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginBottom: 8 }}>{t.noLocations}</Text>
      )}

      {/* Add/Edit Location */}
      <View style={[styles.addLocBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{editingLocId ? t.editLocation : t.addNewLocation}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          value={newLoc.name}
          onChangeText={(v) => setNewLoc({ ...newLoc, name: v })}
        />
        <View style={styles.locInputRow}>
          <TextInput
            style={[styles.locInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="V"
            placeholderTextColor={colors.textMuted}
            value={String(newLoc.voltage)}
            onChangeText={(v) => setNewLoc({ ...newLoc, voltage: Number(v) || 0 })}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.locInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="A"
            placeholderTextColor={colors.textMuted}
            value={String(newLoc.amperage)}
            onChangeText={(v) => setNewLoc({ ...newLoc, amperage: Number(v) || 0 })}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.locInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="kW"
            placeholderTextColor={colors.textMuted}
            value={String(newLoc.kw)}
            onChangeText={(v) => setNewLoc({ ...newLoc, kw: Number(v) || 0 })}
            keyboardType="numeric"
          />
        </View>
        <Pressable onPress={handleSaveLocation} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "#FFF", fontWeight: "500", fontSize: 14 }}>{editingLocId ? t.updateLocation : t.addLocation}</Text>
        </Pressable>
        {editingLocId && (
          <Pressable onPress={cancelEdit} style={{ alignItems: "center", padding: 6 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, textDecorationLine: "underline" }}>{t.cancelEdit}</Text>
          </Pressable>
        )}
      </View>

      {/* GAS URL */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{t.gasUrl}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
        value={settings.gasUrl}
        onChangeText={(v) => updateSettings({ gasUrl: v })}
        placeholder="https://script.google.com/..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />

      {/* Export */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{t.jsonExport}</Text>
      <Pressable
        onPress={async () => {
          try {
            await exportJson(history, locations, settings);
            showToast(t.jsonExportSuccess, "success");
          } catch { showToast("Export failed", "error"); }
        }}
        style={[styles.exportBtn, { borderColor: colors.primary }]}
      >
        <MaterialCommunityIcons name="download" size={16} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "500" }}>{t.jsonExport}</Text>
      </Pressable>

      {/* Offline Queue */}
      {offlineQueue.length > 0 && (
        <View style={[styles.queueBox, { backgroundColor: colors.warning + "1A", borderColor: colors.warning + "4D" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MaterialCommunityIcons name="wifi-off" size={16} color={colors.warning} />
            <Text style={{ color: colors.warning, fontSize: 14, fontWeight: "500" }}>
              {t.offlineQueue}: {offlineQueue.length} {t.pendingItems}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t.autoSendOnline}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  label: { fontSize: 12, marginBottom: 4 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15, marginBottom: 12 },
  themeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  themeBtn: { flex: 1, alignItems: "center", gap: 4, padding: 12, borderRadius: 12, borderWidth: 1 },
  langRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  presetBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  nightRateRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  nightRateInput: { borderRadius: 8, borderWidth: 1, padding: 8, width: 80, fontSize: 14, marginLeft: "auto" },
  locCard: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8, gap: 8 },
  addLocBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 4 },
  locInputRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  locInput: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10, fontSize: 14 },
  addBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  queueBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 12 },
});
