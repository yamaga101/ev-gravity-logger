import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useTheme";
import { useSettingsStore } from "../../store/useSettingsStore";
import { getTranslations } from "../../../shared/i18n";
import { SettingsPanel } from "../../components/settings/SettingsPanel";

export default function SettingsTab() {
  const { colors } = useAppTheme();
  const lang = useSettingsStore((s) => s.lang);
  const t = getTranslations(lang);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsPanel t={t} />
    </SafeAreaView>
  );
}
