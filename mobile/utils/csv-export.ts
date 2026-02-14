import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { CSV_HEADERS, DEFAULT_BATTERY_CAPACITY, DEFAULT_ELECTRICITY_RATE } from "../../shared/constants/defaults";
import type { ChargingRecord, VehicleSettings, Language } from "../../shared/types";
import { calcChargedKwh, calcCost, calcDurationMinutes, calcChargeSpeed } from "../../shared/utils/calculations";
import { formatDate, formatDuration } from "../../shared/utils/formatting";

export async function exportCSV(
  history: ChargingRecord[],
  settings: VehicleSettings,
  lang: Language,
): Promise<void> {
  const capacity = settings.batteryCapacity || DEFAULT_BATTERY_CAPACITY;
  const rate = settings.electricityRate || DEFAULT_ELECTRICITY_RATE;
  const BOM = "\uFEFF";
  const headers = CSV_HEADERS[lang];

  const rows = history.map((h) => {
    const kwh = calcChargedKwh(
      capacity,
      h.startBattery || 0,
      h.endBattery || h.batteryAfter || 0,
    );
    const cost = calcCost(kwh, rate);
    const duration =
      h.startTime && h.endTime
        ? calcDurationMinutes(h.startTime, h.endTime)
        : 0;
    const speed = calcChargeSpeed(kwh, duration);

    return [
      h.startTime ? formatDate(h.startTime) : formatDate(h.timestamp || ""),
      h.startTime || "",
      h.endTime || "",
      h.odometer || "",
      h.startBattery || h.battery || "",
      h.endBattery || h.batteryAfter || "",
      h.startRange || "",
      h.endRange || "",
      kwh.toFixed(1),
      cost,
      formatDuration(duration),
      speed.toFixed(1),
      h.efficiency || "",
      h.locationName || "",
    ]
      .map((v) => `"${v}"`)
      .join(",");
  });

  const csv = BOM + headers.join(",") + "\n" + rows.join("\n");
  const fileName = `ev-gravity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "text/csv",
    dialogTitle: fileName,
  });
}
