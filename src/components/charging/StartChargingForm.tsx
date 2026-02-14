import { useState } from "react";
import { PlugZap, MapPin, ChevronDown } from "lucide-react";
import { SmartNumberInput } from "../inputs/SmartNumberInput.tsx";
import { DateTimeInput } from "../inputs/DateTimeInput.tsx";
import { Odometer } from "../inputs/Odometer.tsx";
import { useChargingStore } from "../../store/useChargingStore.ts";
import { useSettingsStore } from "../../store/useSettingsStore.ts";
import { useLocationStore } from "../../store/useLocationStore.ts";
import { generateId, getLocalISOString } from "../../utils/formatting.ts";
import type { Translations } from "../../i18n/index.ts";

interface StartChargingFormProps {
  t: Translations;
}

export function StartChargingForm({ t }: StartChargingFormProps) {
  const history = useChargingStore((s) => s.history);
  const startSession = useChargingStore((s) => s.startSession);
  const locations = useLocationStore((s) => s.locations);

  const lastRecord = history[0];
  const [startTime, setStartTime] = useState(getLocalISOString());
  const [odometer, setOdometer] = useState(lastRecord?.odometer ?? 10000);
  const [startBattery, setStartBattery] = useState(
    lastRecord?.endBattery ?? 50,
  );
  const [startRange, setStartRange] = useState(lastRecord?.endRange ?? 200);
  const [efficiency, setEfficiency] = useState(lastRecord?.efficiency ?? 6.0);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const handleStart = () => {
    const loc = locations.find((l) => l.id === selectedLocationId);
    startSession({
      id: generateId(),
      startTime,
      odometer,
      startBattery,
      startRange,
      efficiency,
      startedAt: Date.now(),
      locationName: loc?.name ?? "",
      voltage: loc?.voltage ?? "",
      amperage: loc?.amperage ?? "",
      kw: loc?.kw ?? "",
    });
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm border border-border dark:border-dark-border">
      <div className="flex items-center gap-2 mb-3 text-ev-primary">
        <PlugZap size={20} />
        <h2 className="text-lg font-semibold">{t.startCharging}</h2>
      </div>

      <DateTimeInput label={t.startTime} value={startTime} onChange={setStartTime} />
      <Odometer value={odometer} onChange={setOdometer} label={t.odometer} />

      <div className="flex flex-col gap-2">
        <SmartNumberInput
          label={t.batteryPct}
          value={startBattery}
          unit="%"
          min={0}
          max={100}
          onChange={setStartBattery}
        />
        <SmartNumberInput
          label={t.rangeKm}
          value={startRange}
          unit="km"
          steps={[-10, -1, 1, 10]}
          min={0}
          max={1000}
          onChange={setStartRange}
        />
      </div>

      <SmartNumberInput
        label={t.efficiency}
        value={efficiency}
        unit=""
        steps={[-1, -0.1, 0.1, 1]}
        min={0}
        max={20}
        onChange={setEfficiency}
      />

      {/* Location Selector */}
      <div className="mb-2">
        <label className="text-text-muted text-xs font-medium uppercase tracking-wider pl-1 flex items-center gap-1">
          <MapPin size={12} /> {t.chargingLocation}
        </label>
        <div className="relative mt-1">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-text-primary dark:text-dark-text appearance-none focus:outline-none focus:border-ev-primary focus:ring-2 focus:ring-ev-primary/20"
          >
            <option value="">{t.manualUnspecified}</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.kw}kW)
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full mt-4 py-4 rounded-xl font-semibold text-lg tracking-wide text-white bg-ev-primary hover:bg-ev-primary-dark shadow-lg hover:shadow-ev-primary/30 transition-all active:scale-[0.98]"
      >
        {t.startCharging}
      </button>
    </div>
  );
}
