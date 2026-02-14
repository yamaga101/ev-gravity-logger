import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useTheme";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useChargingStore } from "../../store/useChargingStore";
import { getTranslations } from "../../../shared/i18n";
import { StartChargingForm } from "../../components/charging/StartChargingForm";
import { LiveChargingScreen } from "../../components/charging/LiveChargingScreen";

export default function ChargingTab() {
  const { colors } = useAppTheme();
  const lang = useSettingsStore((s) => s.lang);
  const t = getTranslations(lang);
  const activeSession = useChargingStore((s) => s.activeSession);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {activeSession ? (
        <LiveChargingScreen t={t} />
      ) : (
        <StartChargingForm t={t} />
      )}
    </SafeAreaView>
  );
}
