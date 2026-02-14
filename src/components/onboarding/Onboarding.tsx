import { useState } from "react";
import {
  BatteryCharging,
  BarChart3,
  Download,
  Cloud,
  Car,
  Zap,
} from "lucide-react";
import { useSettingsStore } from "../../store/useSettingsStore.ts";
import { useToastStore } from "../../store/useToastStore.ts";
import {
  PRE_CONFIGURED_GAS_URL,
  DEFAULT_BATTERY_CAPACITY,
  DEFAULT_ELECTRICITY_RATE,
  DEFAULT_NIGHT_RATE,
  VEHICLE_PRESETS,
} from "../../constants/defaults.ts";
import type { Translations } from "../../i18n/index.ts";

interface OnboardingProps {
  t: Translations;
}

export function Onboarding({ t }: OnboardingProps) {
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const showToast = useToastStore((s) => s.showToast);

  const [step, setStep] = useState(0);
  const [capacity, setCapacity] = useState(DEFAULT_BATTERY_CAPACITY);
  const [ratePlan, setRatePlan] = useState(DEFAULT_ELECTRICITY_RATE);
  const [nightRate, setNightRate] = useState(DEFAULT_NIGHT_RATE);
  const [useNightRate, setUseNightRate] = useState(false);
  const [gasUrl, setGasUrl] = useState(PRE_CONFIGURED_GAS_URL);

  const steps = [
    // Step 0: Welcome
    <div key={0} className="slide-in text-center">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ev-primary/10 flex items-center justify-center">
        <Zap size={40} className="text-ev-primary" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text mb-2">
        EV Gravity Logger
      </h2>
      <p className="text-text-primary dark:text-dark-text text-base mb-1">
        {t.welcomeSub1}
      </p>
      <p className="text-text-muted text-sm">{t.welcomeSub2}</p>
      <div className="mt-6 bg-surface-alt dark:bg-gray-800 rounded-xl p-4 text-left space-y-2">
        <div className="flex items-center gap-2 text-text-primary dark:text-dark-text text-sm">
          <BatteryCharging size={16} className="text-ev-primary" /> {t.feat1}
        </div>
        <div className="flex items-center gap-2 text-text-primary dark:text-dark-text text-sm">
          <BarChart3 size={16} className="text-ev-primary" /> {t.feat2}
        </div>
        <div className="flex items-center gap-2 text-text-primary dark:text-dark-text text-sm">
          <Download size={16} className="text-ev-primary" /> {t.feat3}
        </div>
        <div className="flex items-center gap-2 text-text-primary dark:text-dark-text text-sm">
          <Cloud size={16} className="text-ev-primary" /> {t.feat4}
        </div>
      </div>
    </div>,
    // Step 1: Vehicle
    <div key={1} className="slide-in">
      <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
        <Car size={20} className="text-ev-primary" /> {t.vehicleSettings}
      </h2>
      <div className="space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {VEHICLE_PRESETS.map((preset) => (
            <button
              key={preset.capacity}
              onClick={() => setCapacity(preset.capacity)}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                capacity === preset.capacity
                  ? "border-ev-primary bg-ev-primary/5 text-ev-primary"
                  : "border-border dark:border-dark-border text-text-muted"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-text-muted text-xs block mb-1">
            {t.batteryCapacity}
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-lg font-medium text-center text-text-primary dark:text-dark-text focus:outline-none focus:border-ev-primary"
          />
          <p className="text-xs text-text-muted mt-1">{t.azHint}</p>
        </div>
        <div>
          <label className="text-text-muted text-xs block mb-1">
            {t.electricityRate}
          </label>
          <input
            type="number"
            value={ratePlan}
            onChange={(e) => setRatePlan(Number(e.target.value))}
            step="0.01"
            className="w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-lg font-medium text-center text-text-primary dark:text-dark-text focus:outline-none focus:border-ev-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={useNightRate}
            onChange={(e) => setUseNightRate(e.target.checked)}
            className="w-5 h-5 accent-ev-primary"
          />
          <label className="text-text-muted text-sm">{t.nightRate}</label>
          {useNightRate && (
            <input
              type="number"
              value={nightRate}
              onChange={(e) => setNightRate(Number(e.target.value))}
              step="0.01"
              className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface p-2 text-sm w-24 ml-auto text-text-primary dark:text-dark-text focus:outline-none focus:border-ev-primary"
            />
          )}
        </div>
      </div>
    </div>,
    // Step 2: GAS
    <div key={2} className="slide-in">
      <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
        <Cloud size={20} className="text-ev-primary" /> {t.gSheetLink}
      </h2>
      <p className="text-text-muted text-sm mb-4">{t.gSheetDesc}</p>
      <input
        type="text"
        value={gasUrl}
        onChange={(e) => setGasUrl(e.target.value)}
        placeholder="https://script.google.com/..."
        className="w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-sm text-text-primary dark:text-dark-text mb-4 focus:outline-none focus:border-ev-primary"
      />
      <p className="text-xs text-text-muted">{t.gSheetHint}</p>
    </div>,
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      updateSettings({
        batteryCapacity: capacity,
        electricityRate: ratePlan,
        nightRate,
        useNightRate,
        gasUrl,
      });
      completeOnboarding();
      showToast(t.toastWelcome, "success");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-white dark:bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 mb-4 min-h-[400px] flex flex-col justify-between shadow-lg border border-border dark:border-dark-border">
          <div className="flex-1">{steps[step]}</div>
          <div className="mt-6">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl font-semibold text-lg text-white bg-ev-primary hover:bg-ev-primary-dark shadow-lg transition-all active:scale-[0.98]"
            >
              {step < steps.length - 1 ? t.next : t.startCharging}
            </button>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full mt-2 py-2 text-text-muted text-sm hover:text-text-primary dark:hover:text-dark-text"
              >
                {t.back}
              </button>
            )}
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? "bg-ev-primary" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
