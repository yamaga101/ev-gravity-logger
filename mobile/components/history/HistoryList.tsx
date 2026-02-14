import { useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useChargingStore } from "../../store/useChargingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import {
  calcChargedKwh,
  calcCost,
  calcDurationMinutes,
  calcChargeSpeed,
  getChargeSpeedBadge,
} from "../../../shared/utils/calculations";
import { formatDate, formatDuration } from "../../../shared/utils/formatting";
import { exportCSV } from "../../utils/csv-export";
import { DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../../shared/constants/defaults";
import { useAppTheme } from "../../hooks/useTheme";
import { EditSessionModal } from "./EditSessionModal";
import type { ChargingRecord } from "../../../shared/types";
import type { TranslationMap } from "../../../shared/i18n/en";

interface HistoryListProps {
  t: TranslationMap;
}

export function HistoryList({ t }: HistoryListProps) {
  const { colors } = useAppTheme();
  const history = useChargingStore((s) => s.history);
  const deleteRecord = useChargingStore((s) => s.deleteRecord);
  const deleteRecords = useChargingStore((s) => s.deleteRecords);
  const deleteAllRecords = useChargingStore((s) => s.deleteAllRecords);
  const settings = useSettingsStore((s) => s.settings);
  const lang = useSettingsStore((s) => s.lang);
  const showToast = useToastStore((s) => s.showToast);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [editingItem, setEditingItem] = useState<ChargingRecord | null>(null);
  const [showLocFilter, setShowLocFilter] = useState(false);

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    history.forEach((h) => { if (h.locationName) locs.add(h.locationName); });
    return [...locs];
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!locationFilter) return history;
    return history.filter((h) => h.locationName === locationFilter);
  }, [history, locationFilter]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert("", t.confirmDeleteN.replace("{n}", String(selectedIds.length)), [
      { text: t.cancel, style: "cancel" },
      { text: t.delete, style: "destructive", onPress: () => { deleteRecords(selectedIds); setSelectedIds([]); } },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert("", t.confirmDeleteAll, [
      { text: t.cancel, style: "cancel" },
      { text: t.delete, style: "destructive", onPress: deleteAllRecords },
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert("", t.confirmDelete, [
      { text: t.cancel, style: "cancel" },
      { text: t.delete, style: "destructive", onPress: () => deleteRecord(id) },
    ]);
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV(history, settings, lang);
      showToast(t.toastCsvExported, "success");
    } catch {
      showToast("Export failed", "error");
    }
  };

  const renderItem = useCallback(({ item }: { item: ChargingRecord }) => {
    const kwh = calcChargedKwh(capacity, item.startBattery || 0, item.endBattery || item.batteryAfter || 0);
    const cost = calcCost(kwh, rate);
    const duration = item.startTime && item.endTime ? calcDurationMinutes(item.startTime, item.endTime) : 0;
    const speed = calcChargeSpeed(kwh, duration);
    const badge = getChargeSpeedBadge(speed);
    const isSelected = selectedIds.includes(item.id);

    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderLeftColor: isSelected ? colors.primary : badge.color }]}>
        <View style={styles.itemRow}>
          <Pressable onPress={() => toggleSelect(item.id)} style={styles.checkbox}>
            <MaterialCommunityIcons
              name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
              size={22}
              color={isSelected ? colors.primary : colors.textMuted}
            />
          </Pressable>
          <View style={styles.itemContent}>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {item.startTime ? formatDate(item.startTime) : formatDate(item.timestamp || "")}
            </Text>
            <View style={styles.rangeRow}>
              <Text style={[styles.rangeText, { color: colors.text }]}>{item.startRange || "-"}</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textMuted} />
              <Text style={[styles.rangeText, { color: colors.text }]}>{item.endRange || "-"}</Text>
              <Text style={[styles.unitText, { color: colors.textMuted }]}>km</Text>
            </View>
            <Text style={[styles.battText, { color: colors.text }]}>
              {t.battPct}: {item.startBattery || item.battery}% → {item.endBattery || item.batteryAfter}%
            </Text>
            <View style={styles.metricsRow}>
              <Text style={[styles.metric, { color: colors.primary }]}>{kwh.toFixed(1)}kWh</Text>
              <Text style={[styles.metric, { color: colors.success }]}>{"\u00A5"}{cost}</Text>
              {duration > 0 && <Text style={[styles.metric, { color: colors.text }]}>{formatDuration(duration)}</Text>}
              {speed > 0 && <Text style={[styles.metric, { color: badge.color }]}>{badge.emoji} {speed.toFixed(1)}kW</Text>}
            </View>
            {item.locationName ? (
              <View style={styles.locRow}>
                <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
                <Text style={[styles.locText, { color: colors.primary }]}>{item.locationName}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.actionBtns}>
            <Pressable onPress={() => setEditingItem(item)} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { borderWidth: 1, borderColor: colors.error }]}>
              <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }, [selectedIds, capacity, rate, colors, t]);

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingHorizontal: 16 }]}>
        <View style={styles.toolbarLeft}>
          {history.length > 0 && (
            <Pressable onPress={handleExportCSV} style={[styles.toolBtn, { borderColor: colors.primary }]}>
              <MaterialCommunityIcons name="download" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12 }}>{t.csv}</Text>
            </Pressable>
          )}
          {selectedIds.length > 0 ? (
            <Pressable onPress={handleDeleteSelected} style={[styles.toolBtn, { borderColor: colors.error }]}>
              <MaterialCommunityIcons name="delete" size={14} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 12 }}>{t.delete} ({selectedIds.length})</Text>
            </Pressable>
          ) : history.length > 0 ? (
            <Pressable onPress={handleDeleteAll} style={[styles.toolBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t.deleteAll}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Location Filter */}
      {allLocations.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Pressable
            onPress={() => setShowLocFilter(!showLocFilter)}
            style={[styles.filterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>{locationFilter || t.allLocations}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
          {showLocFilter && (
            <View style={[styles.filterList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable onPress={() => { setLocationFilter(""); setShowLocFilter(false); }} style={styles.filterItem}>
                <Text style={{ color: colors.text }}>{t.allLocations}</Text>
              </Pressable>
              {allLocations.map((loc) => (
                <Pressable key={loc} onPress={() => { setLocationFilter(loc); setShowLocFilter(false); }} style={styles.filterItem}>
                  <Text style={{ color: colors.text }}>{loc}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: colors.textMuted, paddingTop: 40 }}>{t.noRecords}</Text>
        }
      />

      <EditSessionModal item={editingItem} onClose={() => setEditingItem(null)} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingTop: 8 },
  toolbarLeft: { flexDirection: "row", gap: 8 },
  toolBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  filterBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 10 },
  filterList: { marginTop: 4, borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  filterItem: { padding: 10 },
  itemCard: { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemRow: { flexDirection: "row", alignItems: "flex-start" },
  checkbox: { marginRight: 10, marginTop: 2 },
  itemContent: { flex: 1 },
  dateText: { fontSize: 11 },
  rangeRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 },
  rangeText: { fontSize: 18, fontWeight: "600" },
  unitText: { fontSize: 11 },
  battText: { fontSize: 13, marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  metric: { fontSize: 12, fontWeight: "500" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locText: { fontSize: 11 },
  actionBtns: { gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
