import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../ui/Modal";
import { SmartNumberInput } from "../inputs/SmartNumberInput";
import { DateTimeInput } from "../inputs/DateTimeInput";
import { useChargingStore } from "../../store/useChargingStore";
import { useAppTheme } from "../../hooks/useTheme";
import type { ChargingRecord } from "../../../shared/types";
import type { TranslationMap } from "../../../shared/i18n/en";

interface EditSessionModalProps {
  item: ChargingRecord | null;
  onClose: () => void;
  t: TranslationMap;
}

export function EditSessionModal({ item, onClose, t }: EditSessionModalProps) {
  const { colors } = useAppTheme();
  const updateRecord = useChargingStore((s) => s.updateRecord);
  const [formData, setFormData] = useState<ChargingRecord | null>(null);

  useEffect(() => {
    if (item) setFormData({ ...item });
  }, [item]);

  if (!item || !formData) return null;

  const handleChange = (field: string, value: number | string) =>
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleSave = () => {
    if (formData) {
      updateRecord(formData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title={t.editSession}
      titleIcon={<MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />}
      footer={
        <View style={styles.footerRow}>
          <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted, fontWeight: "500" }}>{t.cancel}</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
          </Pressable>
        </View>
      }
    >
      <DateTimeInput
        label={t.start}
        value={formData.startTime || formData.timestamp || ""}
        onChange={(v) => handleChange("startTime", v)}
      />
      <DateTimeInput
        label={t.end}
        value={formData.endTime || ""}
        onChange={(v) => handleChange("endTime", v)}
      />

      <SmartNumberInput
        label={t.odometer}
        value={Number(formData.odometer || 0)}
        unit="km"
        steps={[-100, -10, 10, 100]}
        onChange={(v) => handleChange("odometer", v)}
      />

      <SmartNumberInput
        label={t.efficiency}
        value={Number(formData.efficiency)}
        unit="km/kWh"
        steps={[-1, -0.1, 0.1, 1]}
        min={0}
        max={20}
        onChange={(v) => handleChange("efficiency", v)}
      />

      {/* Start Conditions */}
      <View style={[styles.section, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t.startConditions}</Text>
        <SmartNumberInput
          label={t.battPct}
          value={Number(formData.startBattery || formData.battery || 0)}
          unit="%"
          min={0}
          max={100}
          onChange={(v) => handleChange("startBattery", v)}
        />
        <SmartNumberInput
          label={t.range}
          value={Number(formData.startRange || 0)}
          unit="km"
          min={0}
          max={1000}
          onChange={(v) => handleChange("startRange", v)}
        />
      </View>

      {/* End Conditions */}
      <View style={[styles.section, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t.endConditions}</Text>
        <SmartNumberInput
          label={t.battPct}
          value={Number(formData.endBattery || formData.batteryAfter || 0)}
          unit="%"
          min={0}
          max={100}
          onChange={(v) => handleChange("endBattery", v)}
        />
        <SmartNumberInput
          label={t.range}
          value={Number(formData.endRange || 0)}
          unit="km"
          min={0}
          max={1000}
          onChange={(v) => handleChange("endRange", v)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: "row", gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderRadius: 14, alignItems: "center" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  saveBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  section: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
});
