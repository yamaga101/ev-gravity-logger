import type { ChargingRecord, GasPayload } from "../types";

export function buildGasPayload(record: ChargingRecord): GasPayload {
  return {
    startTime: String(record.startTime || ""),
    endTime: String(record.endTime || ""),
    odometer: String(record.odometer || ""),
    efficiency: String(record.efficiency || ""),
    startBattery: String(record.startBattery || ""),
    endBattery: String(record.endBattery || ""),
    startRange: String(record.startRange || ""),
    endRange: String(record.endRange || ""),
    locationName: String(record.locationName || ""),
    voltage: String(record.voltage || ""),
    amperage: String(record.amperage || ""),
    kw: String(record.kw || ""),
    chargedKwh: String(record.chargedKwh || ""),
    cost: String(record.cost || ""),
    duration: String(record.duration || ""),
    chargeSpeed: String(record.chargeSpeed || ""),
  };
}

export async function sendToGas(
  gasUrl: string,
  payload: GasPayload,
): Promise<boolean> {
  try {
    await fetch(gasUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
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
