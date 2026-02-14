import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type {
  ChargingRecord,
  ChargingLocation,
  VehicleSettings,
} from "../../shared/types";

interface ExportData {
  version: string;
  exportedAt: string;
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings;
}

export async function exportJson(
  history: ChargingRecord[],
  locations: ChargingLocation[],
  settings: VehicleSettings,
): Promise<void> {
  const data: ExportData = {
    version: "3.0.0",
    exportedAt: new Date().toISOString(),
    history,
    locations,
    settings,
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `ev-gravity-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "application/json",
    dialogTitle: fileName,
  });
}

export async function importJson(
  fileUri: string,
): Promise<{
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings | null;
}> {
  const text = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const data = JSON.parse(text) as Partial<ExportData>;

  return {
    history: Array.isArray(data.history) ? data.history : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    settings: data.settings ?? null,
  };
}
