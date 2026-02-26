import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { calcChargedKwh, calcCost, calcDurationMinutes } from "../../utils/calculations.ts";
import { formatDuration } from "../../utils/formatting.ts";
import { DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../constants/defaults.ts";
import { useSettingsStore } from "../../store/useSettingsStore.ts";
import { useChargingStore } from "../../store/useChargingStore.ts";
import type { ChargingRecord } from "../../types/index.ts";
import type { Translations } from "../../i18n/index.ts";

interface CompletionSummaryProps {
  record: ChargingRecord;
  onDismiss: () => void;
  t: Translations;
}

export function CompletionSummary({
  record,
  onDismiss,
  t,
}: CompletionSummaryProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateRecord = useChargingStore((s) => s.updateRecord);
  const [visible, setVisible] = useState(true);
  const [soh, setSoh] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoDismiss = () => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 6000);
  };

  useEffect(() => {
    startAutoDismiss();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;
  const kwh = calcChargedKwh(capacity, record.startBattery, record.endBattery);
  const cost = calcCost(kwh, rate);
  const duration = calcDurationMinutes(record.startTime, record.endTime);

  const handleSohFocus = () => {
    // Pause auto-dismiss while user is entering SOH
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSohSave = () => {
    const parsed = parseFloat(soh);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 100) {
      updateRecord({ ...record, soh: parsed });
    }
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onDismiss}
    >
      <div
        className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center min-w-[280px] shadow-xl border border-ev-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Check icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-ev-success/10 flex items-center justify-center">
          <Check size={32} className="text-ev-success" strokeWidth={3} />
        </div>

        <h2 className="text-2xl font-semibold text-ev-primary mb-4">
          {t.chargeComplete}
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-2xl font-semibold text-text-primary dark:text-dark-text">
              {kwh.toFixed(1)}
            </div>
            <div className="text-xs text-text-muted">kWh</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-ev-success">
              &yen;{cost}
            </div>
            <div className="text-xs text-text-muted">{t.cost}</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-text-primary dark:text-dark-text">
              {formatDuration(duration)}
            </div>
            <div className="text-xs text-text-muted">{t.duration}</div>
          </div>
        </div>

        <div className="text-sm text-text-muted mb-4">
          {record.startBattery}% → {record.endBattery}%
        </div>

        {/* SOH input — optional */}
        <div className="border-t border-border dark:border-dark-border pt-3">
          <label className="text-xs text-text-muted block mb-1 text-left">
            {t.sohPct} <span className="opacity-60">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={50}
              max={100}
              step={0.1}
              placeholder="e.g. 85.5"
              value={soh}
              onFocus={handleSohFocus}
              onChange={(e) => setSoh(e.target.value)}
              className="flex-1 rounded-lg border border-border dark:border-dark-border bg-surface-alt dark:bg-gray-800 px-3 py-2 text-sm text-text-primary dark:text-dark-text focus:outline-none focus:border-ev-primary"
            />
            <button
              onClick={handleSohSave}
              className="px-4 py-2 rounded-lg bg-ev-primary text-white text-sm font-medium hover:bg-ev-primary-dark transition-colors"
            >
              {t.done}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
