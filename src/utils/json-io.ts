import type {
  ChargingRecord,
  ChargingLocation,
  VehicleSettings,
} from "../types/index.ts";

interface ExportData {
  version: string;
  exportedAt: string;
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings;
}

export function exportJson(
  history: ChargingRecord[],
  locations: ChargingLocation[],
  settings: VehicleSettings,
): void {
  const data: ExportData = {
    version: "3.0.0",
    exportedAt: new Date().toISOString(),
    history,
    locations,
    settings,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ev-gravity-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidChargingRecord(obj: unknown): obj is ChargingRecord {
  if (!obj || typeof obj !== "object") return false;
  const record = obj as Partial<ChargingRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.startTime === "string" &&
    typeof record.odometer === "number" &&
    typeof record.startBattery === "number" &&
    typeof record.startRange === "number" &&
    typeof record.efficiency === "number" &&
    typeof record.startedAt === "number" &&
    typeof record.locationName === "string" &&
    (typeof record.voltage === "number" || typeof record.voltage === "string") &&
    (typeof record.amperage === "number" || typeof record.amperage === "string") &&
    (typeof record.kw === "number" || typeof record.kw === "string") &&
    typeof record.endTime === "string" &&
    typeof record.endBattery === "number" &&
    typeof record.endRange === "number" &&
    typeof record.chargedKwh === "number" &&
    typeof record.cost === "number" &&
    typeof record.duration === "number" &&
    typeof record.chargeSpeed === "number"
  );
}

function isValidChargingLocation(obj: unknown): obj is ChargingLocation {
  if (!obj || typeof obj !== "object") return false;
  const location = obj as Partial<ChargingLocation>;

  return (
    typeof location.id === "string" &&
    typeof location.name === "string" &&
    typeof location.voltage === "number" &&
    typeof location.amperage === "number" &&
    typeof location.kw === "number"
  );
}

function isValidVehicleSettings(obj: unknown): obj is VehicleSettings {
  if (!obj || typeof obj !== "object") return false;
  const settings = obj as Partial<VehicleSettings>;

  return (
    typeof settings.batteryCapacity === "number" &&
    typeof settings.electricityRate === "number" &&
    typeof settings.nightRate === "number" &&
    typeof settings.useNightRate === "boolean" &&
    typeof settings.gasUrl === "string"
  );
}

export async function importJson(
  file: File,
): Promise<{
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings | null;
}> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<ExportData>;

  // Validate version field (optional but recommended)
  if (data.version && typeof data.version !== "string") {
    throw new Error("Invalid export file: version must be a string");
  }

  // Validate and filter history
  const validHistory: ChargingRecord[] = [];
  if (Array.isArray(data.history)) {
    for (const record of data.history) {
      if (isValidChargingRecord(record)) {
        validHistory.push(record);
      }
    }
  }

  // Validate and filter locations
  const validLocations: ChargingLocation[] = [];
  if (Array.isArray(data.locations)) {
    for (const location of data.locations) {
      if (isValidChargingLocation(location)) {
        validLocations.push(location);
      }
    }
  }

  // Validate settings
  let validSettings: VehicleSettings | null = null;
  if (data.settings && isValidVehicleSettings(data.settings)) {
    validSettings = data.settings;
  }

  return {
    history: validHistory,
    locations: validLocations,
    settings: validSettings,
  };
}
