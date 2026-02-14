import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VehicleSettings, Language, Theme } from "../../shared/types";
import {
  PRE_CONFIGURED_GAS_URL,
  DEFAULT_BATTERY_CAPACITY,
  DEFAULT_ELECTRICITY_RATE,
  DEFAULT_NIGHT_RATE,
} from "../../shared/constants/defaults";

interface SettingsState {
  settings: VehicleSettings;
  lang: Language;
  theme: Theme;
  onboardingDone: boolean;
  updateSettings: (partial: Partial<VehicleSettings>) => void;
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        batteryCapacity: DEFAULT_BATTERY_CAPACITY,
        electricityRate: DEFAULT_ELECTRICITY_RATE,
        nightRate: DEFAULT_NIGHT_RATE,
        useNightRate: false,
        gasUrl: PRE_CONFIGURED_GAS_URL,
      },
      lang: "en",
      theme: "system",
      onboardingDone: false,

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: "ev-settings-v3",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        lang: state.lang,
        theme: state.theme,
        onboardingDone: state.onboardingDone,
      }),
      version: 1,
    },
  ),
);
