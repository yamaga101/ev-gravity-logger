import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useChargingStore } from "../../store/useChargingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { calcChargedKwh, calcCost } from "../../../shared/utils/calculations";
import { DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../../shared/constants/defaults";
import { useAppTheme } from "../../hooks/useTheme";
import type { TranslationMap } from "../../../shared/i18n/en";

interface StatsDashboardProps {
  t: TranslationMap;
}

type Period = "1M" | "3M" | "6M" | "ALL";

export function StatsDashboard({ t }: StatsDashboardProps) {
  const { colors } = useAppTheme();
  const history = useChargingStore((s) => s.history);
  const settings = useSettingsStore((s) => s.settings);
  const [period, setPeriod] = useState<Period>("ALL");

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;

  const filteredHistory = useMemo(() => {
    if (period === "ALL") return history;
    const months = { "1M": 1, "3M": 3, "6M": 6 }[period];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return history.filter((h) => new Date(h.startTime || h.timestamp || "") >= cutoff);
  }, [history, period]);

  const stats = useMemo(() => {
    let totalKwh = 0;
    let totalCost = 0;
    let totalEff = 0;
    let effCount = 0;
    filteredHistory.forEach((h) => {
      const kwh = calcChargedKwh(capacity, h.startBattery || 0, h.endBattery || h.batteryAfter || 0);
      totalKwh += kwh;
      totalCost += calcCost(kwh, rate);
      if (h.efficiency && h.efficiency > 0) { totalEff += h.efficiency; effCount++; }
    });
    return {
      count: filteredHistory.length,
      totalKwh: totalKwh.toFixed(1),
      totalCost: Math.round(totalCost),
      avgEfficiency: effCount > 0 ? (totalEff / effCount).toFixed(1) : "-",
    };
  }, [filteredHistory, capacity, rate]);

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    filteredHistory.forEach((h) => {
      const d = new Date(h.startTime || h.timestamp || "");
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({
        value: count,
        label: month.slice(5),
        frontColor: colors.primary,
      }));
  }, [filteredHistory, colors.primary]);

  const monthlyCostData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    filteredHistory.forEach((h) => {
      const d = new Date(h.startTime || h.timestamp || "");
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const kwh = calcChargedKwh(capacity, h.startBattery || 0, h.endBattery || h.batteryAfter || 0);
      monthMap[key] = (monthMap[key] || 0) + calcCost(kwh, rate);
    });
    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, cost]) => ({
        value: cost,
        label: month.slice(5),
        frontColor: colors.warning,
      }));
  }, [filteredHistory, capacity, rate, colors.warning]);

  const locationData = useMemo(() => {
    const locMap: Record<string, number> = {};
    filteredHistory.forEach((h) => {
      const name = h.locationName || "Unknown";
      locMap[name] = (locMap[name] || 0) + 1;
    });
    return Object.entries(locMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        value: count,
        label: name.slice(0, 8),
        frontColor: colors.secondary,
      }));
  }, [filteredHistory, colors.secondary]);

  const locationDetailData = useMemo(() => {
    const locMap: Record<string, { count: number; totalDuration: number; totalCost: number }> = {};
    filteredHistory.forEach((h) => {
      const name = h.locationName || "Unknown";
      if (!locMap[name]) locMap[name] = { count: 0, totalDuration: 0, totalCost: 0 };
      locMap[name].count++;
      locMap[name].totalDuration += h.duration || 0;
      const kwh = calcChargedKwh(capacity, h.startBattery || 0, h.endBattery || h.batteryAfter || 0);
      locMap[name].totalCost += calcCost(kwh, rate);
    });
    return Object.entries(locMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name: name.slice(0, 12),
        count: data.count,
        avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        avgCost: data.count > 0 ? Math.round(data.totalCost / data.count) : 0,
      }));
  }, [filteredHistory, capacity, rate]);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Period filter */}
      <View style={styles.periodRow}>
        {(["1M", "3M", "6M", "ALL"] as Period[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodBtn, { backgroundColor: period === p ? colors.primary : colors.surfaceAlt }]}
          >
            <Text style={{ color: period === p ? "#FFF" : colors.textMuted, fontSize: 12, fontWeight: "600" }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsGrid}>
        {[
          { value: String(stats.count), label: t.totalSessions, color: colors.text },
          { value: stats.totalKwh, label: t.totalKwh, color: colors.primary },
          { value: `\u00A5${stats.totalCost}`, label: t.totalCost, color: colors.success },
          { value: stats.avgEfficiency, label: t.avgEfficiency, color: colors.text },
        ].map((card, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{card.label}</Text>
          </View>
        ))}
      </View>

      {filteredHistory.length === 0 ? (
        <Text style={{ textAlign: "center", color: colors.textMuted, paddingTop: 40 }}>{t.noDataPeriod}</Text>
      ) : (
        <>
          {/* Monthly Charges */}
          {monthlyData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={[styles.chartTitle, { color: colors.textMuted }]}>{t.monthlyCharges}</Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart
                  data={monthlyData}
                  barWidth={28}
                  barBorderRadius={4}
                  noOfSections={4}
                  yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  hideRules
                  spacing={20}
                  height={130}
                />
              </View>
            </View>
          )}

          {/* Monthly Cost */}
          {monthlyCostData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={[styles.chartTitle, { color: colors.textMuted }]}>{t.monthlyCost}</Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart
                  data={monthlyCostData}
                  barWidth={28}
                  barBorderRadius={4}
                  noOfSections={4}
                  yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  hideRules
                  spacing={20}
                  height={130}
                />
              </View>
            </View>
          )}

          {/* By Location */}
          {locationData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={[styles.chartTitle, { color: colors.textMuted }]}>{t.byLocation}</Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart
                  data={locationData}
                  barWidth={28}
                  barBorderRadius={4}
                  noOfSections={4}
                  yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                  hideRules
                  spacing={20}
                  height={130}
                />
              </View>
            </View>
          )}

          {/* Location Stats Table */}
          {locationDetailData.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={[styles.chartTitle, { color: colors.textMuted }]}>{t.locationStats}</Text>
              <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tableHeaderRow, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>{t.chargingLocation}</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>#</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>{t.avgDuration}</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>{t.avgCost}</Text>
                </View>
                {locationDetailData.map((loc) => (
                  <View key={loc.name} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, { flex: 2, color: colors.text, fontWeight: "500" }]}>{loc.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>{loc.count}</Text>
                    <Text style={[styles.tableCell, { flex: 1, color: colors.textMuted }]}>{loc.avgDuration}m</Text>
                    <Text style={[styles.tableCell, { flex: 1, color: colors.success }]}>{"\u00A5"}{loc.avgCost}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  card: { width: "47%", borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1 },
  cardValue: { fontSize: 22, fontWeight: "600" },
  cardLabel: { fontSize: 11, marginTop: 2 },
  chartSection: { marginBottom: 20 },
  chartTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 },
  chartCard: { borderRadius: 14, padding: 12, borderWidth: 1, overflow: "hidden" },
  tableCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10 },
  tableHeader: { fontSize: 11, fontWeight: "500", color: "#64748B" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1 },
  tableCell: { fontSize: 12 },
});
