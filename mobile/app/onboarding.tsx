import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppTheme } from "../hooks/useTheme";
import { useSettingsStore } from "../store/useSettingsStore";
import { getTranslations } from "../../shared/i18n";
import { Onboarding } from "../components/onboarding/Onboarding";

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const lang = useSettingsStore((s) => s.lang);
  const t = getTranslations(lang);

  const handleComplete = () => {
    useSettingsStore.getState().completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Onboarding t={t} onComplete={handleComplete} />
    </SafeAreaView>
  );
}
