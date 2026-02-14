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

export async function importJson(
  file: File,
): Promise<{
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings | null;
}> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<ExportData>;

  return {
    history: Array.isArray(data.history) ? data.history : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    settings: data.settings ?? null,
  };
}
