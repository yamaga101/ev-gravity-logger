import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { calcChargedKwh, calcCost, calcDurationMinutes } from "../../utils/calculations.ts";
import { formatDuration } from "../../utils/formatting.ts";
import { DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../constants/defaults.ts";
import { useSettingsStore } from "../../store/useSettingsStore.ts";
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
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;
  const kwh = calcChargedKwh(capacity, record.startBattery, record.endBattery);
  const cost = calcCost(kwh, rate);
  const duration = calcDurationMinutes(record.startTime, record.endTime);

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onDismiss}
    >
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center min-w-[280px] shadow-xl border border-ev-primary/20">
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

        <div className="text-sm text-text-muted">
          {record.startBattery}% → {record.endBattery}%
        </div>
      </div>
    </div>
  );
}
