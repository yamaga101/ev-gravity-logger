import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../hooks/useTheme";
import { useSettingsStore } from "../../store/useSettingsStore";
import { getTranslations } from "../../../shared/i18n";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function TabLayout() {
  const { colors } = useAppTheme();
  const lang = useSettingsStore((s) => s.lang);
  const t = getTranslations(lang);

  const tabIcon = (name: IconName, focused: boolean) => (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={focused ? colors.tabBarActive : colors.tabBarInactive}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.charging.replace("...", ""),
          tabBarIcon: ({ focused }) => tabIcon("ev-station", focused),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.history,
          tabBarIcon: ({ focused }) => tabIcon("history", focused),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.statistics,
          tabBarIcon: ({ focused }) => tabIcon("chart-bar", focused),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ focused }) => tabIcon("cog", focused),
        }}
      />
    </Tabs>
  );
}
