import type {
  ChargingRecord,
  GasPayload,
  MaintenanceRecord,
  InspectionRecord,
} from "../types";

export function buildGasPayload(record: ChargingRecord): GasPayload {
  return {
    type: "charging",
    id: record.id,
    status: "completed",
    startTime: String(record.startTime || ""),
    endTime: String(record.endTime || ""),
    startOdometer: String(record.odometer || ""),
    efficiency: String(record.efficiency || ""),
    startSoC: String(record.startBattery || ""),
    endSoC: String(record.endBattery || ""),
    startRange: String(record.startRange || ""),
    endRange: String(record.endRange || ""),
    location: String(record.locationName || ""),
    addedKwh: String(record.chargedKwh || ""),
    cost: String(record.cost || ""),
  };
}

export function buildMaintenanceGasPayload(record: MaintenanceRecord): GasPayload {
  return {
    type: "maintenance",
    id: record.id,
    date: String(record.date || ""),
    category: String(record.category || ""),
    description: String(record.description || ""),
    cost: String(record.cost || ""),
    odometer: String(record.odometer ?? ""),
    nextDueDate: String(record.nextDueDate || ""),
    memo: String(record.memo || ""),
  };
}

export function buildInspectionGasPayload(record: InspectionRecord): GasPayload {
  return {
    type: "inspection",
    id: record.id,
    date: String(record.date || ""),
    inspectionType: String(record.type || ""),
    odometer: String(record.odometer || ""),
    cost: String(record.cost || ""),
    soh: String(record.soh ?? ""),
    nextDueDate: String(record.nextDueDate || ""),
    findings: String(record.findings || ""),
  };
}

export async function sendToGas(
  gasUrl: string,
  payload: GasPayload,
): Promise<boolean> {
  // Enforce HTTPS for security
  if (!gasUrl.startsWith("https://")) {
    throw new Error("GAS URL must use HTTPS protocol");
  }

  try {
    await fetch(gasUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

// isOnline is passed as a parameter so this works on both Web and Mobile
export async function retryQueue(
  gasUrl: string,
  queue: GasPayload[],
  isOnline: boolean,
): Promise<{ remaining: GasPayload[]; sentCount: number }> {
  if (queue.length === 0 || !isOnline || !gasUrl) {
    return { remaining: queue, sentCount: 0 };
  }

  const remaining: GasPayload[] = [];
  for (const item of queue) {
    const success = await sendToGas(gasUrl, item);
    if (!success) {
      remaining.push(item);
    }
  }

  return {
    remaining,
    sentCount: queue.length - remaining.length,
  };
}
